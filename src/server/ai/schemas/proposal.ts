import { z } from "zod";

export const proposalSchema = z.object({
  title: z.string().min(3),
  category: z.enum([
    "personal",
    "ai_collaboration",
    "coding",
    "writing",
    "knowledge",
    "product",
  ]),
  action: z.enum(["add", "modify", "delete"]),
  proposedContent: z.string().min(10),
  reason: z.string().min(10),
  evidence: z.string().min(3),
  affectedArtifacts: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export const proposalCollectionSchema = z.object({
  proposals: z.array(proposalSchema).min(1),
});

export type ProposalOutput = z.infer<typeof proposalCollectionSchema>;
