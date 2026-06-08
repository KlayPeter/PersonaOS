import { ProposalStatus, type ArtifactType, type PlaygroundFeedback } from "@prisma/client";

import { feedbackProposalCollectionSchema } from "@/server/ai/schemas/feedback-proposal";
import { getAIService } from "@/server/ai/services/ai-service";
import { getPrismaClient } from "@/server/db/client";
import { getLatestArtifactByType } from "@/server/domain/artifacts";
import { getOrCreateDefaultWorkspace, serializeWorkspaceProfile } from "@/server/domain/workspace";
import { runWorkflow } from "@/server/harness/workflow-runner";

export async function listPlaygroundRuns() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.playgroundRun.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      sourceArtifact: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function playgroundRunWorkflow(input: {
  artifactType: ArtifactType;
  task: string;
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const ai = getAIService();

  return runWorkflow(
    {
      workspaceId: workspace.id,
      workflowType: "playground_run",
    },
    async (workflow) => {
      const selectedArtifact = await workflow.step(
        "load_selected_artifact",
        input,
        async () => {
          const artifact = await getLatestArtifactByType(input.artifactType);

          if (!artifact) {
            throw new Error("当前类型还没有已生成资产，请先去 Artifacts 页面生成。");
          }

          return artifact;
        },
      );

      const outputPayload = await workflow.step(
        "run_task_with_artifact",
        {
          artifactType: selectedArtifact.type,
          artifactVersion: selectedArtifact.version,
          task: input.task,
        },
        async ({ recordLLMRun }) => {
          const result = await ai.runPlayground({
            artifact: {
              type: selectedArtifact.type,
              title: selectedArtifact.title,
              content: selectedArtifact.content,
              version: selectedArtifact.version,
            },
            workspaceProfile: serializeWorkspaceProfile(workspace),
            task: input.task,
          });

          await recordLLMRun(result.log);
          return result.output;
        },
      );

      const run = await workflow.step(
        "save_playground_run",
        {
          artifactId: selectedArtifact.id,
          task: input.task,
        },
        async () => {
          return prisma.playgroundRun.create({
            data: {
              workspaceId: workspace.id,
              sourceArtifactId: selectedArtifact.id,
              artifactType: selectedArtifact.type,
              inputTask: input.task,
              output: outputPayload.output,
            },
            include: {
              sourceArtifact: true,
            },
          });
        },
      );

      return run;
    },
  );
}

export async function feedbackToProposalWorkflow(input: {
  runId: string;
  feedbackType: PlaygroundFeedback;
  feedbackText?: string;
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const ai = getAIService();

  return runWorkflow(
    {
      workspaceId: workspace.id,
      workflowType: "feedback_to_proposal",
    },
    async (workflow) => {
      const run = await workflow.step(
        "load_playground_run",
        input,
        async () => {
          const found = await prisma.playgroundRun.findFirst({
            where: {
              id: input.runId,
              workspaceId: workspace.id,
            },
            include: {
              sourceArtifact: true,
            },
          });

          if (!found) {
            throw new Error("Playground 记录不存在。");
          }

          return found;
        },
      );

      const feedbackContext = await workflow.step(
        "collect_feedback",
        {
          runId: input.runId,
          feedbackType: input.feedbackType,
          feedbackText: input.feedbackText ?? "",
        },
        async () => {
          if (input.feedbackType === "good") {
            const updated = await prisma.playgroundRun.update({
              where: { id: run.id },
              data: {
                feedback: input.feedbackType,
                feedbackText: input.feedbackText,
              },
            });

            return { run: updated, proposals: [] as Array<{ id: string; title: string }> };
          }

          const result = await ai.convertFeedbackToProposal({
            artifactType: run.artifactType,
            task: run.inputTask,
            output: run.output,
            feedbackType: input.feedbackType,
            feedbackText: input.feedbackText,
          });

          return { run, llmResult: result };
        },
      );

      if ("proposals" in feedbackContext) {
        return feedbackContext;
      }

      const validated = await workflow.step(
        "validate_feedback_proposals_schema",
        feedbackContext.llmResult.output,
        async () => feedbackProposalCollectionSchema.parse(feedbackContext.llmResult.output),
      );

      const proposals = await workflow.step(
        "persist_feedback_proposals",
        {
          proposalCount: validated.proposals.length,
        },
        async ({ recordLLMRun }) => {
          await recordLLMRun(feedbackContext.llmResult.log);

          const created = await Promise.all(
            validated.proposals.map((proposal) =>
              prisma.ruleProposal.create({
                data: {
                  workspaceId: workspace.id,
                  title: proposal.title,
                  category: proposal.category,
                  action: proposal.action,
                  proposedContent: proposal.proposedContent,
                  reason: proposal.reason,
                  evidence: proposal.evidence,
                  affectedArtifacts: proposal.affectedArtifacts,
                  confidence: proposal.confidence,
                  status: ProposalStatus.pending,
                },
              }),
            ),
          );

          await prisma.playgroundRun.update({
            where: { id: run.id },
            data: {
              feedback: input.feedbackType,
              feedbackText: input.feedbackText,
            },
          });

          return created;
        },
      );

      return {
        runId: run.id,
        proposals: proposals.map((proposal) => ({
          id: proposal.id,
          title: proposal.title,
        })),
      };
    },
  );
}
