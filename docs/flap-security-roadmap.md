# Flap security roadmap

## Implemented in this pass

- Stable HttpOnly run-session binding (IP remains rate-limit-only).
- One active weekly run and five weekly starts per session per 24 hours.
- Deterministic tie ordering for submission rank and leaderboard display.
- Client pause/focus/visibility telemetry, validated and stored with the consumed run.

## Next queued work

- ~~Wallet signature challenge and server-side signer recovery; use the authenticated wallet instead of the submitted address.~~ Implemented with EIP-191 `personal_sign` and server-side recovery.
- Server-issued chunked obstacle seeds with signed/committed chunk proofs in score replay.
- Competitive start/finish timestamps, pause accounting, and exact competition cutoff/grace enforcement.
- Social/account verification or manual finalist review for Sybil resistance.
- Official competition rules, prize eligibility, privacy, and dispute policy.
