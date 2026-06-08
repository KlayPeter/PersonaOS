import { z } from "zod";

import { proposalSchema } from "@/server/ai/schemas/proposal";

export const feedbackProposalCollectionSchema = z.object({
  proposals: z.array(proposalSchema).min(1),
});

export type FeedbackProposalOutput = z.infer<typeof feedbackProposalCollectionSchema>;
