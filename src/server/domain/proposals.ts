import {
  MaterialStatus,
  ProposalStatus,
  type Prisma,
  type ProposalCategory,
  type ProposalStatus as ProposalStatusType,
} from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";
import { runWorkflow } from "@/server/harness/workflow-runner";

function jsonArrayToStrings(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function serializeAffectedArtifacts(value: Prisma.JsonValue | null | undefined) {
  return jsonArrayToStrings(value);
}

export async function listProposals(status?: ProposalStatusType) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.ruleProposal.findMany({
    where: {
      workspaceId: workspace.id,
      ...(status ? { status } : {}),
    },
    include: {
      material: true,
      insight: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProposalById(proposalId: string) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.ruleProposal.findFirst({
    where: {
      id: proposalId,
      workspaceId: workspace.id,
    },
    include: {
      material: true,
      insight: true,
    },
  });
}

export async function rejectProposal(proposalId: string) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const proposal = await getProposalById(proposalId);

  if (!proposal) {
    throw new Error("提案不存在，无法拒绝。");
  }

  if (proposal.status !== ProposalStatus.pending) {
    throw new Error("只有待审核提案可以被拒绝。");
  }

  const updatedProposal = await prisma.ruleProposal.update({
    where: { id: proposal.id },
    data: {
      status: ProposalStatus.rejected,
    },
  });

  await prisma.changelog.create({
    data: {
      workspaceId: workspace.id,
      changeType: "proposal_rejected",
      summary: `拒绝提案：${proposal.title}`,
      detail: `用户拒绝了提案「${proposal.title}」，未对正式规则库产生变更。`,
      relatedProposalId: proposal.id,
    },
  });

  return updatedProposal;
}

type ApplyProposalInput = {
  proposalId: string;
  decision: "accept" | "edit_and_accept";
  editedTitle?: string;
  editedContent?: string;
  editedCategory?: ProposalCategory;
};

export async function applyProposalWorkflow(input: ApplyProposalInput) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return runWorkflow(
    {
      workspaceId: workspace.id,
      workflowType: "apply_proposal",
    },
    async (workflow) => {
      const proposal = await workflow.step(
        "load_proposal",
        {
          proposalId: input.proposalId,
          decision: input.decision,
        },
        async () => {
          const found = await prisma.ruleProposal.findFirst({
            where: {
              id: input.proposalId,
              workspaceId: workspace.id,
            },
            include: {
              material: true,
            },
          });

          if (!found) {
            throw new Error("提案不存在。");
          }

          return found;
        },
      );

      const validatedDecision = await workflow.step(
        "validate_human_decision",
        input,
        async () => {
          if (proposal.status !== ProposalStatus.pending) {
            throw new Error("只有 pending 状态的提案可以继续处理。");
          }

          if (input.decision === "edit_and_accept") {
            const editedTitle = input.editedTitle?.trim();
            const editedContent = input.editedContent?.trim();

            if (!editedTitle || !editedContent) {
              throw new Error("编辑后接受时，标题和内容不能为空。");
            }
          }

          return {
            title:
              input.decision === "edit_and_accept"
                ? input.editedTitle!.trim()
                : proposal.title,
            content:
              input.decision === "edit_and_accept"
                ? input.editedContent!.trim()
                : proposal.proposedContent,
            category:
              input.decision === "edit_and_accept" && input.editedCategory
                ? input.editedCategory
                : proposal.category,
            finalStatus:
              input.decision === "edit_and_accept"
                ? ProposalStatus.edited
                : ProposalStatus.accepted,
          };
        },
      );

      const ruleResult = await workflow.step(
        "apply_rule_change",
        {
          proposalId: proposal.id,
          action: proposal.action,
          category: validatedDecision.category,
        },
        async () => {
          const existingRule = await prisma.rule.findFirst({
            where: {
              workspaceId: workspace.id,
              category: validatedDecision.category,
              title: validatedDecision.title,
              status: "active",
            },
            orderBy: { updatedAt: "desc" },
          });

          if (proposal.action === "delete") {
            if (!existingRule) {
              return { rule: null, changeType: "rule_deleted" as const };
            }

            const archived = await prisma.rule.update({
              where: { id: existingRule.id },
              data: {
                status: "archived",
                sourceProposalId: proposal.id,
                sourceMaterialId: proposal.materialId ?? existingRule.sourceMaterialId,
              },
            });

            return { rule: archived, changeType: "rule_deleted" as const };
          }

          if (proposal.action === "modify" && existingRule) {
            const updated = await prisma.rule.update({
              where: { id: existingRule.id },
              data: {
                category: validatedDecision.category,
                title: validatedDecision.title,
                content: validatedDecision.content,
                sourceProposalId: proposal.id,
                sourceMaterialId: proposal.materialId ?? existingRule.sourceMaterialId,
              },
            });

            return { rule: updated, changeType: "rule_modified" as const };
          }

          const created = await prisma.rule.create({
            data: {
              workspaceId: workspace.id,
              category: validatedDecision.category,
              title: validatedDecision.title,
              content: validatedDecision.content,
              sourceProposalId: proposal.id,
              sourceMaterialId: proposal.materialId ?? undefined,
            },
          });

          return {
            rule: created,
            changeType:
              proposal.action === "modify" ? ("rule_modified" as const) : ("rule_added" as const),
          };
        },
      );

      const changelog = await workflow.step(
        "write_changelog",
        {
          proposalId: proposal.id,
          ruleId: ruleResult.rule?.id ?? null,
          changeType: ruleResult.changeType,
        },
        async () => {
          return prisma.changelog.create({
            data: {
              workspaceId: workspace.id,
              changeType: ruleResult.changeType,
              summary: `${validatedDecision.title} 已进入 Rulebase`,
              detail: [
                `提案标题：${proposal.title}`,
                `最终标题：${validatedDecision.title}`,
                `动作：${proposal.action}`,
                `原因：${proposal.reason}`,
              ].join("\n"),
              relatedProposalId: proposal.id,
              relatedRuleId: ruleResult.rule?.id,
            },
          });
        },
      );

      const finalizedProposal = await workflow.step(
        "update_proposal_status",
        {
          proposalId: proposal.id,
          finalStatus: validatedDecision.finalStatus,
        },
        async () => {
          const updatedProposal = await prisma.ruleProposal.update({
            where: { id: proposal.id },
            data: {
              status: validatedDecision.finalStatus,
              title: validatedDecision.title,
              proposedContent: validatedDecision.content,
              category: validatedDecision.category,
            },
          });

          if (proposal.materialId) {
            await prisma.material.update({
              where: { id: proposal.materialId },
              data: {
                status: MaterialStatus.used,
              },
            });
          }

          return updatedProposal;
        },
      );

      return {
        proposal: finalizedProposal,
        rule: ruleResult.rule,
        changelogId: changelog.id,
      };
    },
  );
}
