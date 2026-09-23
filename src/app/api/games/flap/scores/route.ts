import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { MAX_SCORE_BODY_BYTES, scoreSubmissionSchema } from "@/features/flap/schemas";
import { decodeFlaps, replayRun, seedFromRunId, TICK_MS } from "@/features/flap/simulation";
import { seedFromChallengeKey } from "@/features/flap/challenge";
import { getVerifiedWallet } from "@/features/flap/auth";
import {
  enforceRateLimit,
  getRequestIdentity,
  getRunSession,
  jsonProblem,
  readSmallJson,
  RequestProblem,
} from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "flap-scores", 20);
    const parsed = scoreSubmissionSchema.safeParse(await readSmallJson(request, MAX_SCORE_BODY_BYTES));
    if (!parsed.success) throw new RequestProblem(400, parsed.error.issues[0]?.message ?? "Invalid score");

    const { runId, wallet, mcap, ticks, flaps, mode, challengeKey, telemetry } = parsed.data;
    const verifiedWallet = mode === "weekly" ? await getVerifiedWallet(request) : null;
    if (mode === "weekly" && !verifiedWallet) throw new RequestProblem(401, "Verify your wallet before publishing a weekly score");
    const submissionWallet = verifiedWallet ?? wallet;

    // Replay the run with the seed tied to this run token; only a score the simulation reproduces is accepted.
    const replaySeed = mode === "weekly" && challengeKey ? seedFromChallengeKey(challengeKey) : seedFromRunId(runId);
    const replay = replayRun(replaySeed, decodeFlaps(flaps), ticks);
    if (!replay.ok) throw new RequestProblem(422, `Run could not be verified: ${replay.reason}`);
    if (replay.score !== mcap) throw new RequestProblem(422, "Run could not be verified: score does not match replay");

    // Game time can't exceed real time since the token was issued (1s of slack for clock and network jitter).
    const minElapsedMs = Math.ceil(ticks * TICK_MS) - 1_000;
    // Rate limiting still uses IP; run ownership uses the stable HttpOnly session cookie.
    const clientHash = getRunSession(request) ?? getRequestIdentity(request);
    const db = getDatabase();
    const result = await db.execute<{ wallet: string; best_mcap: number; updated_at: Date; rank: number }>(mode === "weekly" ? sql`
      WITH claimed AS (
        UPDATE flap_runs SET used_at = now(), telemetry = ${JSON.stringify(telemetry)}::jsonb
        WHERE id = ${runId} AND client_hash = ${clientHash} AND used_at IS NULL AND expires_at > now()
          AND mode = 'weekly' AND challenge_key = ${challengeKey ?? ""} AND wallet = lower(${submissionWallet})
          AND extract(epoch FROM (now() - issued_at)) * 1000 >= ${minElapsedMs}
        RETURNING id
      ), upserted AS (
        INSERT INTO flap_weekly_leaderboard (challenge_key, wallet, best_mcap, updated_at)
        SELECT ${challengeKey ?? ""}, lower(${submissionWallet}), ${mcap}, now() FROM claimed
        ON CONFLICT (challenge_key, wallet) DO UPDATE SET best_mcap = greatest(flap_weekly_leaderboard.best_mcap, excluded.best_mcap), updated_at = CASE WHEN excluded.best_mcap > flap_weekly_leaderboard.best_mcap THEN now() ELSE flap_weekly_leaderboard.updated_at END
        RETURNING wallet, best_mcap, updated_at
      ) SELECT u.wallet, u.best_mcap, u.updated_at, (SELECT count(*)::int + 1 FROM flap_weekly_leaderboard l WHERE l.challenge_key = ${challengeKey ?? ""} AND (l.best_mcap > u.best_mcap OR (l.best_mcap = u.best_mcap AND (l.updated_at < u.updated_at OR (l.updated_at = u.updated_at AND l.wallet < u.wallet))))) AS rank FROM upserted u
    ` : sql`
      WITH claimed AS (
        UPDATE flap_runs
        SET used_at = now(), telemetry = ${JSON.stringify(telemetry)}::jsonb
        WHERE id = ${runId}
          AND client_hash = ${clientHash}
          AND used_at IS NULL
          AND expires_at > now()
          AND extract(epoch FROM (now() - issued_at)) * 1000 >= ${minElapsedMs}
        RETURNING id
      ), upserted AS (
        INSERT INTO flap_leaderboard (wallet, best_mcap, updated_at)
        SELECT lower(${submissionWallet}), ${mcap}, now() FROM claimed
        ON CONFLICT (wallet) DO UPDATE
          SET best_mcap = greatest(flap_leaderboard.best_mcap, excluded.best_mcap),
              updated_at = CASE
                WHEN excluded.best_mcap > flap_leaderboard.best_mcap THEN now()
                ELSE flap_leaderboard.updated_at
              END
        RETURNING wallet, best_mcap, updated_at
      )
      SELECT u.wallet, u.best_mcap,
        (SELECT count(*)::int + 1 FROM flap_leaderboard l WHERE l.best_mcap > u.best_mcap OR (l.best_mcap = u.best_mcap AND (l.updated_at < u.updated_at OR (l.updated_at = u.updated_at AND l.wallet < u.wallet)))) AS rank
      FROM upserted u
    `);

    const saved = result.rows[0];
    if (!saved) throw new RequestProblem(409, "Run token is invalid, expired, reused, or the run was faster than real time");

    return Response.json(
      { ok: true, wallet: saved.wallet, mcap: Number(saved.best_mcap), rank: Number(saved.rank) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonProblem(error);
  }
}
