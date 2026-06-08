import { applyProposalWorkflow } from "@/server/domain/proposals";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await applyProposalWorkflow({
      proposalId: id,
      decision: "accept",
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "接受提案失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
