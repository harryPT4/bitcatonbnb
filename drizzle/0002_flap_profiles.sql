CREATE TABLE IF NOT EXISTS flap_profiles (
  wallet text PRIMARY KEY,
  display_name text,
  verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flap_runs ADD COLUMN IF NOT EXISTS telemetry jsonb;
ALTER TABLE flap_runs ADD COLUMN IF NOT EXISTS wallet text;
