import { analyzeMaterialWorkflow } from "@/server/harness/workflows/analyze-material";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await analyzeMaterialWorkflow(id);

    return Response.json({ data: result.result, workflowRunId: result.workflowRunId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "运行 analyze workflow 失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
