import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";

export async function listWorkflowRuns(limit = 20) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.workflowRun.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      stepRuns: {
        include: {
          llmRuns: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { startedAt: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
