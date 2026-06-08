import { z } from "zod";

import {
  getOrCreateDefaultWorkspace,
  serializeWorkspaceProfile,
  updateWorkspaceProfile,
} from "@/server/domain/workspace";

const workspaceProfileSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  identity: z.string().min(2),
  primaryScenarios: z.array(z.string()),
  rememberNotes: z.string().min(2),
  dislikedBehaviors: z.array(z.string()),
  outputPreferences: z.array(z.string()),
  exportGoals: z.array(z.string()),
  profileSummary: z.string().min(2),
});

export async function GET() {
  const workspace = await getOrCreateDefaultWorkspace();
  return Response.json(serializeWorkspaceProfile(workspace));
}

export async function POST() {
  const workspace = await getOrCreateDefaultWorkspace();
  return Response.json(serializeWorkspaceProfile(workspace));
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const payload = workspaceProfileSchema.parse(json);
    const workspace = await updateWorkspaceProfile(payload);

    return Response.json(serializeWorkspaceProfile(workspace));
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新 workspace 失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
