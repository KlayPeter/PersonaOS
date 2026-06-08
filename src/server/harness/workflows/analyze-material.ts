import { ProposalStatus } from "@prisma/client";

import { getAIService } from "@/server/ai/services/ai-service";
import { insightCollectionSchema } from "@/server/ai/schemas/insight";
import { proposalCollectionSchema } from "@/server/ai/schemas/proposal";
import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace, serializeWorkspaceProfile } from "@/server/domain/workspace";
import { runWorkflow } from "@/server/harness/workflow-runner";

export async function analyzeMaterialWorkflow(materialId: string) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const ai = getAIService();

  const material = await prisma.material.findFirst({
    where: {
      id: materialId,
      workspaceId: workspace.id,
    },
  });

  if (!material) {
    throw new Error("素材不存在，无法执行 analyze workflow。");
  }

  return runWorkflow(
    {
      workspaceId: workspace.id,
      workflowType: "analyze_material",
    },
    async (workflow) => {
      const workspaceContext = await workflow.step(
        "load_workspace_context",
        { workspaceId: workspace.id, materialId },
        async () => {
          const rules = await prisma.rule.findMany({
            where: {
              workspaceId: workspace.id,
              status: "active",
            },
            orderBy: { updatedAt: "desc" },
          });

          return {
            workspaceProfile: serializeWorkspaceProfile(workspace),
            material,
            existingRules: rules.map((rule) => ({
              title: rule.title,
              content: rule.content,
            })),
          };
        },
      );

      const insightPayload = await workflow.step(
        "extract_insights",
        workspaceContext,
        async ({ recordLLMRun }) => {
          const result = await ai.analyzeMaterial({
            workspaceProfile: workspaceContext.workspaceProfile,
            material: {
              title: material.title,
              type: material.type,
              summary: material.summary ?? "",
              content: material.content,
            },
            existingRules: workspaceContext.existingRules,
          });

          await recordLLMRun(result.log);
          return result.output;
        },
      );

      const validatedInsights = await workflow.step(
        "validate_insights_schema",
        insightPayload,
        async () => insightCollectionSchema.parse(insightPayload),
      );

      const savedInsights = await workflow.step(
        "persist_insights",
        validatedInsights,
        async () => {
          await prisma.insight.deleteMany({
            where: { materialId: material.id },
          });

          return Promise.all(
            validatedInsights.insights.map((insight) =>
              prisma.insight.create({
                data: {
                  workspaceId: workspace.id,
                  materialId: material.id,
                  type: insight.type,
                  title: insight.title,
                  description: insight.description,
                  evidence: insight.evidence,
                  confidence: insight.confidence,
                },
              }),
            ),
          );
        },
      );

      const proposalPayload = await workflow.step(
        "generate_rule_proposals",
        {
          materialId: material.id,
          insights: validatedInsights.insights,
        },
        async ({ recordLLMRun }) => {
          const result = await ai.generateRuleProposals({
            insights: validatedInsights.insights,
            material: {
              title: material.title,
              type: material.type,
            },
          });

          await recordLLMRun(result.log);
          return result.output;
        },
      );

      const validatedProposals = await workflow.step(
        "validate_proposals_schema",
        proposalPayload,
        async () => proposalCollectionSchema.parse(proposalPayload),
      );

      const savedProposals = await workflow.step(
        "persist_proposals",
        validatedProposals,
        async () => {
          await prisma.ruleProposal.deleteMany({
            where: { materialId: material.id, status: ProposalStatus.pending },
          });

          return Promise.all(
            validatedProposals.proposals.map((proposal, index) =>
              prisma.ruleProposal.create({
                data: {
                  workspaceId: workspace.id,
                  materialId: material.id,
                  insightId: savedInsights[index]?.id,
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
        },
      );

      await workflow.step(
        "update_material_status",
        { materialId: material.id, nextStatus: "analyzed" },
        async () => {
          return prisma.material.update({
            where: { id: material.id },
            data: { status: "analyzed" },
          });
        },
      );

      return {
        materialId: material.id,
        insights: savedInsights.length,
        proposals: savedProposals.length,
      };
    },
  );
}
