import { z } from "zod";

import { feedbackToProposalWorkflow } from "@/server/domain/playground";

const payloadSchema = z.object({
  feedbackType: z.enum([
    "good",
    "not_like_me",
    "too_vague",
    "too_short",
    "too_long",
    "too_scattered",
    "too_template",
    "logic_weak",
    "examples_missing",
    "custom",
  ]),
  feedbackText: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const { id } = await context.params;
    const result = await feedbackToProposalWorkflow({
      runId: id,
      feedbackType: payload.feedbackType,
      feedbackText: payload.feedbackText,
    });
    const generatedProposalIds = Array.isArray(result.result.proposals)
      ? result.result.proposals.map((proposal) => proposal.id)
      : [];

    return Response.json({
      generatedProposalIds,
      workflowRunId: result.workflowRunId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交 Playground 反馈失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
