import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { createRunSession, enforceRateLimit, getRequestIdentity, getRunSession, hashRunSession, jsonProblem, RequestProblem, RUN_SESSION_COOKIE_NAME } from "@/server/http";
import { getWeeklyChallenge } from "@/features/flap/challenge";
import { getVerifiedWallet } from "@/features/flap/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // One token per game; quick restarts can use a few per minute.
    await enforceRateLimit(request, "flap-runs", 40);
    const db = getDatabase();
    const ipHash = getRequestIdentity(request);
    const session = getRunSession(request);
    const newSession = session ? null : createRunSession();
    const clientHash = session ?? (newSession ? hashRunSession(newSession) : ipHash);
    const mode = new URL(request.url).searchParams.get("mode") === "weekly" ? "weekly" : "classic";
    const challenge = mode === "weekly" ? getWeeklyChallenge() : null;
    const verifiedWallet = mode === "weekly" ? await getVerifiedWallet(request) : null;
    if (mode === "weekly" && !verifiedWallet) throw new RequestProblem(401, "Verify your wallet before starting a ranked weekly run");

    const result = await db.execute<{ id: string; expires_at: Date }>(sql`
      WITH cleanup AS (
        DELETE FROM flap_runs WHERE expires_at < now() - interval '1 hour'
      ), guard AS (
        SELECT
          count(*) FILTER (WHERE mode = 'weekly' AND issued_at > now() - interval '24 hours') AS daily_weekly,
          count(*) FILTER (WHERE mode = 'weekly' AND used_at IS NULL AND expires_at > now()) AS active_weekly
        FROM flap_runs WHERE client_hash = ${clientHash}
      ), inserted AS (
        INSERT INTO flap_runs (client_hash, expires_at, mode, challenge_key, wallet)
        SELECT ${clientHash}, now() + interval '60 minutes', ${mode}, ${challenge?.key ?? null}, ${verifiedWallet}
        FROM guard
        WHERE ${mode} <> 'weekly' OR (daily_weekly < 5 AND active_weekly = 0)
        RETURNING id, expires_at
      )
      SELECT id, expires_at FROM inserted
    `);

    const run = result.rows[0];
    if (!run) throw new RequestProblem(429, "Weekly runs are limited to one active run and five starts per day");
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (newSession) headers.set("Set-Cookie", `${RUN_SESSION_COOKIE_NAME}=${newSession}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
    return Response.json(
      { ok: true, runId: run.id, expiresAt: run.expires_at, mode, ...(challenge ?? {}) },
      { status: 201, headers },
    );
  } catch (error) {
    return jsonProblem(error);
  }
}
