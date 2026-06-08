import { z } from "zod";

export const insightSchema = z.object({
  type: z.enum([
    "preference",
    "principle",
    "boundary",
    "style",
    "workflow",
    "anti_pattern",
  ]),
  title: z.string().min(3),
  description: z.string().min(10),
  evidence: z.string().min(3),
  confidence: z.number().min(0).max(1),
});

export const insightCollectionSchema = z.object({
  insights: z.array(insightSchema).min(1),
});

export type InsightOutput = z.infer<typeof insightCollectionSchema>;
