import { rejectProposal } from "@/server/domain/proposals";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const proposal = await rejectProposal(id);
    return Response.json(proposal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "拒绝提案失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
