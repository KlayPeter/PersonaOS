import { z } from "zod";

import { generateArtifactWorkflow } from "@/server/domain/artifacts";

const payloadSchema = z.object({
  type: z.enum(["agents_md", "writing_style", "personal_system"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const result = await generateArtifactWorkflow(payload.type);

    return Response.json({
      artifact: result.result,
      workflowRunId: result.workflowRunId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成资产失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
