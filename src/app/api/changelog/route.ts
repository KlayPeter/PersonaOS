import { listChangelog } from "@/server/domain/changelog";

export async function GET() {
  const changelog = await listChangelog();
  return Response.json(changelog);
}
