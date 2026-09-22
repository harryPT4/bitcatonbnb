import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { enforceRateLimit, jsonProblem } from "@/server/http";
import { getWeeklyChallenge } from "@/features/flap/challenge";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "flap-leaderboard", 60);
    const db = getDatabase();
    const weekly = new URL(request.url).searchParams.get("mode") === "weekly";
    const challenge = weekly ? getWeeklyChallenge() : null;
    const result = await db.execute<{ rank: number; wallet: string; mcap: number }>(weekly ? sql`
      SELECT row_number() OVER (ORDER BY best_mcap DESC, updated_at ASC, wallet ASC)::int AS rank, wallet, best_mcap AS mcap
      FROM flap_weekly_leaderboard WHERE challenge_key = ${challenge!.key}
      ORDER BY best_mcap DESC, updated_at ASC, wallet ASC LIMIT 25
    ` : sql`
      SELECT row_number() OVER (ORDER BY best_mcap DESC, updated_at ASC, wallet ASC)::int AS rank,
             wallet,
             best_mcap AS mcap
      FROM flap_leaderboard
      ORDER BY best_mcap DESC, updated_at ASC, wallet ASC
      LIMIT 25
    `);

    return Response.json(
      {
        ok: true,
        mode: weekly ? "weekly" : "classic",
        ...(challenge ?? {}),
        board: result.rows.map((row) => ({ ...row, rank: Number(row.rank), mcap: Number(row.mcap) })),
      },
      { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=45" } },
    );
  } catch (error) {
    return jsonProblem(error);
  }
}
