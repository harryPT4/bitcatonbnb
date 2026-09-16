import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getDatabase();
    await db.execute(sql`SELECT 1`);
    return Response.json(
      { ok: true, database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
