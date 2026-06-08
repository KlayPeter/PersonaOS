import { z } from "zod";

import { updateRule } from "@/server/domain/rules";

const payloadSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(10),
  category: z.enum([
    "personal",
    "ai_collaboration",
    "coding",
    "writing",
    "knowledge",
    "product",
  ]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const { id } = await context.params;
    const rule = await updateRule({
      ruleId: id,
      title: payload.title,
      content: payload.content,
      category: payload.category,
    });

    return Response.json(rule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新规则失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
