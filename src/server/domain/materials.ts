import { MaterialStatus, type Prisma } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";

function jsonArrayToStrings(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function listMaterials() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.material.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMaterialDetail(materialId: string) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.material.findFirst({
    where: {
      id: materialId,
      workspaceId: workspace.id,
    },
    include: {
      insights: {
        orderBy: { createdAt: "desc" },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createMaterial(input: {
  title: string;
  type:
    | "article"
    | "code_rule"
    | "prompt"
    | "feedback"
    | "failed_output"
    | "note"
    | "project_description";
  summary: string;
  content: string;
  tags: string[];
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.material.create({
    data: {
      workspaceId: workspace.id,
      title: input.title,
      type: input.type,
      summary: input.summary,
      content: input.content,
      tags: input.tags as Prisma.InputJsonValue,
      status: MaterialStatus.unprocessed,
    },
  });
}

export function serializeMaterialTags(value: Prisma.JsonValue | null | undefined) {
  return jsonArrayToStrings(value);
}

export async function getDashboardSnapshot() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  const [materialCount, insightCount, proposalCount, workflowCount, recentMaterials] =
    await Promise.all([
      prisma.material.count({ where: { workspaceId: workspace.id } }),
      prisma.insight.count({ where: { workspaceId: workspace.id } }),
      prisma.ruleProposal.count({ where: { workspaceId: workspace.id } }),
      prisma.workflowRun.count({ where: { workspaceId: workspace.id } }),
      prisma.material.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  return {
    workspace,
    stats: [
      { label: "素材", value: materialCount, hint: "Inbox 中的输入基线" },
      { label: "洞察", value: insightCount, hint: "结构化中间产物" },
      { label: "提案", value: proposalCount, hint: "待人工确认的候选规则" },
      { label: "流程运行", value: workflowCount, hint: "Harness 执行痕迹" },
    ],
    recentMaterials,
  };
}
