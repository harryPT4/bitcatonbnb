import { createHash, randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { DatabaseEnvironmentError, DatabaseUnavailableError, getDatabase } from "@/db/client";

const MAX_JSON_BYTES = 4_096;

export class RequestProblem extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RequestProblem";
  }
}

export async function readSmallJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new RequestProblem(415, "Content-Type must be application/json");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestProblem(413, "Request body is too large");
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new RequestProblem(413, "Request body is too large");
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new RequestProblem(400, "Request body must be valid JSON");
  }
}

export function getRequestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = request.headers.get("x-real-ip") ?? forwarded ?? "unknown";
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt && process.env.NODE_ENV === "production") {
    throw new RequestProblem(503, "Rate limiting is not configured");
  }
  return createHash("sha256").update(`${salt}:${candidate}`).digest("hex");
}

const RUN_SESSION_COOKIE = "bitcat_flap_session";
export function getRunSession(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.match(new RegExp(`(?:^|;\\s*)${RUN_SESSION_COOKIE}=([^;]+)`))?.[1];
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  return hashRunSession(value);
}
export function createRunSession() {
  return randomBytes(32).toString("hex");
}
export function hashRunSession(value: string) {
  return createHash("sha256").update(`flap-session:${value}`).digest("hex");
}
export const RUN_SESSION_COOKIE_NAME = RUN_SESSION_COOKIE;

export async function enforceRateLimit(request: Request, route: string, limit: number) {
  const db = getDatabase();
  const identity = getRequestIdentity(request);
  const key = `${route}:${identity}`;
  const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000);

  const result = await db.execute<{ hits: number }>(sql`
    WITH cleanup AS (
      DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '2 days'
    )
    INSERT INTO rate_limit_buckets (key, window_start, hits)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start)
    DO UPDATE SET hits = rate_limit_buckets.hits + 1
    RETURNING hits
  `);

  const hits = Number(result.rows[0]?.hits ?? limit + 1);
  if (hits > limit) throw new RequestProblem(429, "Too many requests; try again shortly");
}

export function jsonProblem(error: unknown) {
  if (error instanceof RequestProblem) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }

  if (error instanceof DatabaseUnavailableError || error instanceof DatabaseEnvironmentError) {
    return Response.json({ ok: false, error: error.message }, { status: 503 });
  }

  console.error("Unhandled API error", error);
  return Response.json({ ok: false, error: "Service temporarily unavailable" }, { status: 503 });
}
