import { z } from "zod";

export const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid BNB address");

export const scoreSubmissionSchema = z.object({
  runId: z.uuid(),
  wallet: walletSchema,
  mcap: z.number().int().min(0).max(1_000_000_000).refine((value) => value % 50_000 === 0, {
    message: "Score must follow the game scoring increments",
  }),
});
