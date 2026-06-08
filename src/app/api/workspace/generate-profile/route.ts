import { z } from "zod";

import { generateInitialWorkspaceProfile } from "@/server/domain/workspace";

const payloadSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  identity: z.string().min(2),
  primaryScenarios: z.array(z.string()).min(1),
  rememberNotes: z.string().min(2),
  dislikedBehaviors: z.array(z.string()).min(1),
  outputPreferences: z.array(z.string()).min(1),
  exportGoals: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const result = await generateInitialWorkspaceProfile(payload);

    return Response.json({
      profileSummary: result.summary,
      log: {
        promptName: result.log.promptName,
        promptVersion: result.log.promptVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成初始画像失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
