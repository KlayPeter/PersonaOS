import type { Prisma, Workspace } from "@prisma/client";

import { workspaceProfileSummarySchema } from "@/server/ai/schemas/workspace-profile";
import { getAIService } from "@/server/ai/services/ai-service";
import { getPrismaClient } from "@/server/db/client";

export type WorkspaceProfile = {
  id: string;
  name: string;
  description: string;
  identity: string;
  primaryScenarios: string[];
  rememberNotes: string;
  dislikedBehaviors: string[];
  outputPreferences: string[];
  exportGoals: string[];
  profileSummary: string;
};

function jsonArrayToStrings(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function serializeWorkspaceProfile(workspace: Workspace): WorkspaceProfile {
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description ?? "",
    identity: workspace.identity ?? "",
    primaryScenarios: jsonArrayToStrings(workspace.primaryScenarios),
    rememberNotes: workspace.rememberNotes ?? "",
    dislikedBehaviors: jsonArrayToStrings(workspace.dislikedBehaviors),
    outputPreferences: jsonArrayToStrings(workspace.outputPreferences),
    exportGoals: jsonArrayToStrings(workspace.exportGoals),
    profileSummary: workspace.profileSummary ?? "",
  };
}

export async function getOrCreateDefaultWorkspace() {
  const prisma = getPrismaClient();
  const email = process.env.DEFAULT_USER_EMAIL ?? "demo@personaos.local";
  const name = process.env.DEFAULT_USER_NAME ?? "PersonaOS Demo";
  const workspaceName =
    process.env.DEFAULT_WORKSPACE_NAME ?? "My Personal System";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { userId: user.id },
    update: { name: workspaceName },
    create: {
      userId: user.id,
      name: workspaceName,
      description: "PersonaOS 的默认个人体系空间。",
      profileSummary: "从素材中提炼规则，并通过人工确认沉淀为长期资产。",
    },
  });

  return workspace;
}

export async function updateWorkspaceProfile(input: {
  name: string;
  description: string;
  identity: string;
  primaryScenarios: string[];
  rememberNotes: string;
  dislikedBehaviors: string[];
  outputPreferences: string[];
  exportGoals: string[];
  profileSummary: string;
}) {
  const prisma = getPrismaClient();
  const workspace = await getOrCreateDefaultWorkspace();

  return prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      name: input.name,
      description: input.description,
      identity: input.identity,
      primaryScenarios: input.primaryScenarios as Prisma.InputJsonValue,
      rememberNotes: input.rememberNotes,
      dislikedBehaviors: input.dislikedBehaviors as Prisma.InputJsonValue,
      outputPreferences: input.outputPreferences as Prisma.InputJsonValue,
      exportGoals: input.exportGoals as Prisma.InputJsonValue,
      profileSummary: input.profileSummary,
    },
  });
}

export async function generateInitialWorkspaceProfile(input: {
  name: string;
  description: string;
  identity: string;
  primaryScenarios: string[];
  rememberNotes: string;
  dislikedBehaviors: string[];
  outputPreferences: string[];
  exportGoals: string[];
}) {
  const ai = getAIService();
  const result = await ai.generateWorkspaceProfileSummary(input);

  return {
    summary: workspaceProfileSummarySchema.parse(result.output).profileSummary,
    log: result.log,
  };
}
