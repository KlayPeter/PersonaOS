import { z } from "zod";

import { applyProposalWorkflow } from "@/server/domain/proposals";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const { id } = await context.params;
    const result = await applyProposalWorkflow({
      proposalId: id,
      decision: "edit_and_accept",
      editedTitle: payload.title,
      editedContent: payload.content,
      editedCategory: payload.category,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "编辑后接受失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
