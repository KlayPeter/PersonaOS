import { z } from "zod";

import { playgroundRunWorkflow } from "@/server/domain/playground";

const payloadSchema = z.object({
  artifactType: z.enum(["agents_md", "writing_style", "personal_system"]),
  task: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const result = await playgroundRunWorkflow({
      artifactType: payload.artifactType,
      task: payload.task,
    });

    return Response.json({
      run: result.result,
      workflowRunId: result.workflowRunId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "运行 Playground 失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
