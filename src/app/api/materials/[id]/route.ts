import { deleteMaterial, getMaterialDetail, serializeMaterialTags } from "@/server/domain/materials";

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const material = await deleteMaterial(id);

    return Response.json({
      id: material.id,
      deleted: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除素材失败。";
    const status = message === "素材不存在。" ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}
