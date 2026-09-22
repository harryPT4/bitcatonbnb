import { bigint, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
    mode: text("mode").default("classic").notNull(),
    challengeKey: text("challenge_key"),
    wallet: text("wallet"),
    telemetry: jsonb("telemetry"),
  },
  (table) => [index("flap_runs_client_issued_idx").on(table.clientHash, table.issuedAt)],
);

export const flapWeeklyLeaderboard = pgTable(
  "flap_weekly_leaderboard",
  { challengeKey: text("challenge_key").notNull(), wallet: text("wallet").notNull(), bestMcap: bigint("best_mcap", { mode: "number" }).notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [primaryKey({ columns: [table.challengeKey, table.wallet] }), index("flap_weekly_best_idx").on(table.challengeKey, table.bestMcap)],
);

/** Wallet-owned profile data. `verifiedAt` is intentionally required before display names are public. */
export const flapProfiles = pgTable("flap_profiles", {
  wallet: text("wallet").primaryKey(),
  displayName: text("display_name"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const flapWalletChallenges = pgTable("flap_wallet_challenges", {
  nonce: text("nonce").primaryKey(),
  wallet: text("wallet").notNull(),
  message: text("message").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  sessionHash: text("session_hash"),
  sessionExpiresAt: timestamp("session_expires_at", { withTimezone: true }),
});

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    hits: integer("hits").default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);
