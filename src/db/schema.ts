import { bigint, index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const flapLeaderboard = pgTable(
  "flap_leaderboard",
  {
    wallet: text("wallet").primaryKey(),
    bestMcap: bigint("best_mcap", { mode: "number" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("flap_leaderboard_best_idx").on(table.bestMcap)],
);

export const flapRuns = pgTable(
  "flap_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientHash: text("client_hash").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [index("flap_runs_client_issued_idx").on(table.clientHash, table.issuedAt)],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    hits: integer("hits").default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);
