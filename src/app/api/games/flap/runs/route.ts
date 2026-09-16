import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { enforceRateLimit, getRequestIdentity, jsonProblem } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "flap-runs", 12);
    const db = getDatabase();
    const clientHash = getRequestIdentity(request);

    const result = await db.execute<{ id: string; expires_at: Date }>(sql`
      WITH cleanup AS (
        DELETE FROM flap_runs WHERE expires_at < now() - interval '1 hour'
      )
      INSERT INTO flap_runs (client_hash, expires_at)
      VALUES (${clientHash}, now() + interval '15 minutes')
      RETURNING id, expires_at
    `);

    const run = result.rows[0];
    return Response.json(
      { ok: true, runId: run.id, expiresAt: run.expires_at },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonProblem(error);
  }
}
