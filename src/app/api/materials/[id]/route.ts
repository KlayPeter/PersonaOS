import { getMaterialDetail, serializeMaterialTags } from "@/server/domain/materials";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const material = await getMaterialDetail(id);

  if (!material) {
    return Response.json({ error: "素材不存在。" }, { status: 404 });
  }

  return Response.json({
    ...material,
    tags: serializeMaterialTags(material.tags),
    proposals: material.proposals.map((proposal) => ({
      ...proposal,
      affectedArtifacts: Array.isArray(proposal.affectedArtifacts)
        ? proposal.affectedArtifacts.filter((item): item is string => typeof item === "string")
        : [],
    })),
  });
}
