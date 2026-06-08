import type { ArtifactType } from "@prisma/client";

import { artifactMetadata } from "@/server/artifacts/registry";
import { compileArtifactMarkdown } from "@/server/artifacts/compilers/markdown";
import { getPrismaClient } from "@/server/db/client";
import { getOrCreateDefaultWorkspace } from "@/server/domain/workspace";
import { runWorkflow } from "@/server/harness/workflow-runner";

export async function listArtifacts() {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.artifact.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: [{ type: "asc" }, { version: "desc" }],
  });
}

export async function getLatestArtifactByType(type: ArtifactType) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.artifact.findFirst({
    where: {
      workspaceId: workspace.id,
      type,
    },
    orderBy: { version: "desc" },
  });
}

export async function getLatestArtifacts() {
  const artifacts = await listArtifacts();
  const latestByType = new Map<ArtifactType, (typeof artifacts)[number]>();

  for (const artifact of artifacts) {
    if (!latestByType.has(artifact.type)) {
      latestByType.set(artifact.type, artifact);
    }
  }

  return latestByType;
}

export async function generateArtifactWorkflow(type: ArtifactType) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return runWorkflow(
    {
      workspaceId: workspace.id,
      workflowType: "generate_artifact",
    },
    async (workflow) => {
      const rules = await workflow.step(
        "load_rulebase",
        { workspaceId: workspace.id, type },
        async () => {
          const activeRules = await prisma.rule.findMany({
            where: {
              workspaceId: workspace.id,
              status: "active",
            },
            orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
          });

          if (activeRules.length === 0) {
            throw new Error("当前还没有正式规则，无法生成资产。");
          }

          return activeRules;
        },
      );

      const artifactContext = await workflow.step(
        "build_artifact_context",
        { type, ruleCount: rules.length },
        async () => ({
          workspaceName: workspace.name,
          type,
          ruleCount: rules.length,
          rules,
        }),
      );

      const content = await workflow.step(
        "generate_artifact_draft",
        artifactContext,
        async () => compileArtifactMarkdown(type, rules),
      );

      const artifact = await workflow.step(
        "persist_artifact",
        { type, length: content.length },
        async () => {
          const latest = await prisma.artifact.findFirst({
            where: {
              workspaceId: workspace.id,
              type,
            },
            orderBy: { version: "desc" },
          });

          const version = latest ? latest.version + 1 : 1;
          const metadata = artifactMetadata[type];

          const created = await prisma.artifact.create({
            data: {
              workspaceId: workspace.id,
              type,
              title: metadata.title,
              content,
              version,
            },
          });

          await prisma.changelog.create({
            data: {
              workspaceId: workspace.id,
              changeType: "artifact_generated",
              summary: `生成 ${metadata.title} v${version}`,
              detail: `基于当前 Rulebase 生成了 ${metadata.title} 第 ${version} 个版本。`,
            },
          });

          return created;
        },
      );

      return artifact;
    },
  );
}
