import { z } from "zod";

export const workspaceProfileSummarySchema = z.object({
  profileSummary: z.string().min(20),
});

export type WorkspaceProfileSummaryOutput = z.infer<typeof workspaceProfileSummarySchema>;
