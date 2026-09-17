import { z } from "zod";
import { MAX_FLAPS, MAX_RUN_TICKS } from "@/features/flap/simulation";

export const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid BNB address");

/** Score submissions carry the full input log so the server can replay the run. */
export const MAX_SCORE_BODY_BYTES = 96_000;

export const scoreSubmissionSchema = z.object({
  runId: z.uuid(),
  wallet: walletSchema,
  mcap: z.number().int().min(0).max(1_000_000_000).refine((value) => value % 50_000 === 0, {
    message: "Score must follow the game scoring increments",
  }),
  /** Tick on which the run crashed. */
  ticks: z.number().int().min(1).max(MAX_RUN_TICKS),
  /** Flap ticks, delta-encoded: the first entry is absolute, the rest are gaps. */
  flaps: z.array(z.number().int().min(0).max(MAX_RUN_TICKS)).min(1).max(MAX_FLAPS),
});
