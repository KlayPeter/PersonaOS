import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";

export async function listChangelog() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.changelog.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      relatedProposal: true,
      relatedRule: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
