import { archiveRule } from "@/server/domain/rules";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const rule = await archiveRule(id);
    return Response.json(rule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "归档规则失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
