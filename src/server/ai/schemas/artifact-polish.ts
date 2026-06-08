import { z } from "zod";

export const artifactPolishSchema = z.object({
  content: z.string().min(20),
});

export type ArtifactPolishOutput = z.infer<typeof artifactPolishSchema>;
