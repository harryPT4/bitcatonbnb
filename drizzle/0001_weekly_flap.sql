ALTER TABLE flap_runs ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'classic';
ALTER TABLE flap_runs ADD COLUMN IF NOT EXISTS challenge_key text;
CREATE TABLE IF NOT EXISTS flap_weekly_leaderboard (challenge_key text NOT NULL, wallet text NOT NULL, best_mcap bigint NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (challenge_key, wallet));
CREATE INDEX IF NOT EXISTS flap_weekly_best_idx ON flap_weekly_leaderboard (challenge_key, best_mcap);
