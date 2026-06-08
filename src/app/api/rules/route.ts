import { listRules } from "@/server/domain/rules";

export async function GET() {
  const rules = await listRules();
  return Response.json(rules);
}
