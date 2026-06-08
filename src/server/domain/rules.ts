import { RuleStatus, type ProposalCategory } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";

export async function listRules() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.rule.findMany({
    where: {
      workspaceId: workspace.id,
      status: RuleStatus.active,
    },
    include: {
      sourceProposal: true,
      sourceMaterial: true,
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });
}

export async function updateRule(input: {
  ruleId: string;
  title: string;
  content: string;
  category: ProposalCategory;
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const existing = await prisma.rule.findFirst({
    where: {
      id: input.ruleId,
      workspaceId: workspace.id,
    },
  });

  if (!existing) {
    throw new Error("规则不存在。");
  }

  const updated = await prisma.rule.update({
    where: { id: existing.id },
    data: {
      title: input.title,
      content: input.content,
      category: input.category,
    },
  });

  await prisma.changelog.create({
    data: {
      workspaceId: workspace.id,
      changeType: "rule_modified",
      summary: `手动更新规则：${updated.title}`,
      detail: `用户在 Rulebase 中手动编辑了规则「${updated.title}」。`,
      relatedRuleId: updated.id,
      relatedProposalId: updated.sourceProposalId ?? undefined,
    },
  });

  return updated;
}

export async function archiveRule(ruleId: string) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();
  const existing = await prisma.rule.findFirst({
    where: {
      id: ruleId,
      workspaceId: workspace.id,
    },
  });

  if (!existing) {
    throw new Error("规则不存在。");
  }

  const archived = await prisma.rule.update({
    where: { id: existing.id },
    data: {
      status: RuleStatus.archived,
    },
  });

  await prisma.changelog.create({
    data: {
      workspaceId: workspace.id,
      changeType: "rule_archived",
      summary: `归档规则：${archived.title}`,
      detail: `用户归档了规则「${archived.title}」。`,
      relatedRuleId: archived.id,
      relatedProposalId: archived.sourceProposalId ?? undefined,
    },
  });

  return archived;
}
