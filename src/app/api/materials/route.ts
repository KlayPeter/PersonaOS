import { z } from "zod";

import {
  createMaterial,
  listMaterials,
  serializeMaterialTags,
} from "@/server/domain/materials";

const materialSchema = z.object({
  title: z.string().min(2),
  type: z.enum([
    "article",
    "code_rule",
    "prompt",
    "feedback",
    "failed_output",
    "note",
    "project_description",
  ]),
  summary: z.string().min(2),
  tags: z.array(z.string()).default([]),
  content: z.string().min(10),
});

export async function GET() {
  const materials = await listMaterials();

  return Response.json(
    materials.map((material) => ({
      ...material,
      tags: serializeMaterialTags(material.tags),
    })),
  );
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = materialSchema.parse(json);
    const material = await createMaterial(payload);

    return Response.json({
      ...material,
      tags: serializeMaterialTags(material.tags),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建素材失败。";
    return Response.json({ error: message }, { status: 400 });
  }
}
