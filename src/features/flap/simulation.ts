/**
 * Deterministic BITCAT Flap simulation, shared by the browser game and the scores API.
 *
 * The server verifies a submitted score by replaying the run: same seed (derived from the run id),
 * same flap ticks, same physics. Keep this module free of DOM, time, and Math.random so both sides
 * compute bit-identical results; anything purely visual (particles, sway, sounds) lives in the client.
 */

export const FLAP_WIDTH = 600;
export const FLAP_HEIGHT = 853;
export const GROUND_HEIGHT = 78;

/** Physics constants are tuned per 60Hz tick. */
export const TICK_MS = 1000 / 60;
export const TICKS_PER_SECOND = 60;

export const MCAP_CANDLE = 100_000;
export const MCAP_COIN = 50_000;

const GRAVITY = 0.38;
const FLAP_VELOCITY = -8.2;
export const PIPE_WIDTH = 78;
const GAP = 210;
const SPEED = 3.15;
/** Candles spawn on a fixed tick cadence, so the difficulty ramp never changes MCAP per second. */
const SPAWN_TICKS = 96;
/** The first candle spawns shortly after the start flap; no randomness is used before this tick. */
export const FIRST_SPAWN_TICK = 24;
const CANDLES_PER_LEVEL = 10;
const MAX_LEVEL = 5;
const SPEED_PER_LEVEL = 0.2;
const GAP_SHRINK_PER_LEVEL = 8;
const COIN_RADIUS = 16;

/** Longest run the server will replay (40 minutes of play). */
export const MAX_RUN_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const MAX_FLAPS = 20_000;

export type Pipe = { x: number; top: number; gap: number; wick: number; passed: boolean };
export type Coin = { x: number; y: number; r: number; taken: boolean };

export type Simulation = {
  /** Ticks stepped since the run started. Flaps are recorded against this value. */
  tick: number;
  cat: { x: number; y: number; w: number; h: number; vy: number };
  pipes: Pipe[];
  coins: Coin[];
  score: number;
  cleared: number;
  level: number;
  lastSpawnTick: number;
  /** mulberry32 state; null until a seed is attached (must happen before FIRST_SPAWN_TICK). */
  rng: number | null;
  crashed: boolean;
};

export type StepEvents = {
  candles: number;
  levelUp: boolean;
  coins: { x: number; y: number }[];
  crashed: boolean;
};

/** Derives the 32-bit seed from the server-issued run id (a random v4 UUID). */
export function seedFromRunId(runId: string): number {
  return Number.parseInt(runId.replace(/-/g, "").slice(0, 8), 16) >>> 0;
}

export function createSimulation(seed: number | null = null): Simulation {
  return {
    tick: 0,
    cat: { x: 86, y: FLAP_HEIGHT * 0.42, w: 108, h: 76, vy: 0 },
    pipes: [],
    coins: [],
    score: 0,
    cleared: 0,
    level: 0,
    lastSpawnTick: FIRST_SPAWN_TICK - SPAWN_TICKS,
    rng: seed === null ? null : seed >>> 0,
    crashed: false,
  };
}

export function attachSeed(sim: Simulation, seed: number) {
  if (sim.rng !== null) return;
  if (sim.tick >= FIRST_SPAWN_TICK) throw new Error("Seed must be attached before the first candle spawns");
  sim.rng = seed >>> 0;
}

export function flap(sim: Simulation) {
  if (!sim.crashed) sim.cat.vy = FLAP_VELOCITY;
}

export function currentSpeed(sim: Simulation) {
  return SPEED + sim.level * SPEED_PER_LEVEL;
}

function random(sim: Simulation) {
  if (sim.rng === null) throw new Error("Simulation has no seed");
  // mulberry32: integer-only math, identical in every JS engine.
  sim.rng = (sim.rng + 0x6d2b79f5) >>> 0;
  let t = sim.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function spawnPipe(sim: Simulation) {
  const gap = GAP - sim.level * GAP_SHRINK_PER_LEVEL;
  const minTop = 90;
  const maxTop = FLAP_HEIGHT - 160 - gap;
  // Always draw the same three numbers per spawn so the sequence never depends on outcomes.
  const top = minTop + random(sim) * (maxTop - minTop);
  const wick = 18 + random(sim) * 22;
  const hasCoin = random(sim) < 0.45;
  sim.pipes.push({ x: FLAP_WIDTH + 20, top, gap, wick, passed: false });
  if (hasCoin) sim.coins.push({ x: FLAP_WIDTH + 20 + PIPE_WIDTH / 2, y: top + gap / 2, r: COIN_RADIUS, taken: false });
  sim.lastSpawnTick = sim.tick;
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Advances one 60Hz tick. A crashed simulation no longer changes. */
export function step(sim: Simulation): StepEvents {
  const events: StepEvents = { candles: 0, levelUp: false, coins: [], crashed: false };
  if (sim.crashed) return events;

  sim.tick += 1;
  const cat = sim.cat;
  cat.vy += GRAVITY;
  cat.y += cat.vy;

  if (sim.tick - sim.lastSpawnTick >= SPAWN_TICKS) spawnPipe(sim);

  const speed = currentSpeed(sim);
  for (const pipe of sim.pipes) pipe.x -= speed;
  for (const coin of sim.coins) coin.x -= speed;
  sim.pipes = sim.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH - 10);
  sim.coins = sim.coins.filter((coin) => coin.x > -40 && !coin.taken);

  // Tighter box on the body; the tail and carried coin don't collide.
  const cx = cat.x + 28;
  const cy = cat.y + 14;
  const cw = cat.w - 40;
  const ch = cat.h - 28;
  const groundY = FLAP_HEIGHT - GROUND_HEIGHT;

  for (const pipe of sim.pipes) {
    const bottomY = pipe.top + pipe.gap;
    if (
      overlaps(cx, cy, cw, ch, pipe.x, 0, PIPE_WIDTH, pipe.top) ||
      overlaps(cx, cy, cw, ch, pipe.x, bottomY, PIPE_WIDTH, groundY - bottomY)
    ) {
      sim.crashed = true;
      events.crashed = true;
      return events;
    }
    if (!pipe.passed && pipe.x + PIPE_WIDTH < cat.x) {
      pipe.passed = true;
      sim.cleared += 1;
      sim.score += MCAP_CANDLE;
      events.candles += 1;
      const nextLevel = Math.min(MAX_LEVEL, Math.floor(sim.cleared / CANDLES_PER_LEVEL));
      if (nextLevel > sim.level) {
        sim.level = nextLevel;
        events.levelUp = true;
      }
    }
  }

  for (const coin of sim.coins) {
    const dx = cat.x + cat.w / 2 - coin.x;
    const dy = cat.y + cat.h / 2 - coin.y;
    const reach = coin.r + 28;
    if (dx * dx + dy * dy < reach * reach) {
      coin.taken = true;
      sim.score += MCAP_COIN;
      events.coins.push({ x: coin.x, y: coin.y });
    }
  }

  if (cat.y + cat.h > groundY || cat.y < -20) {
    sim.crashed = true;
    events.crashed = true;
  }
  return events;
}

/** Flap ticks travel as gaps between flaps (first entry is the absolute tick) to keep payloads small. */
export function encodeFlaps(ticks: readonly number[]): number[] {
  return ticks.map((tick, i) => (i === 0 ? tick : tick - ticks[i - 1]));
}

export function decodeFlaps(deltas: readonly number[]): number[] {
  const ticks: number[] = [];
  let tick = 0;
  deltas.forEach((delta, i) => {
    tick = i === 0 ? delta : tick + delta;
    ticks.push(tick);
  });
  return ticks;
}

export type ReplayResult =
  | { ok: true; score: number; ticks: number }
  | { ok: false; reason: string };

/**
 * Replays a run from its seed and flap ticks. Flaps must be strictly increasing, start with the
 * launch flap at tick 0, all happen before the crash, and the run must crash exactly at `crashTick`.
 */
export function replayRun(seed: number, flapTicks: readonly number[], crashTick: number): ReplayResult {
  if (!Number.isInteger(crashTick) || crashTick < 1 || crashTick > MAX_RUN_TICKS) {
    return { ok: false, reason: "Run length is out of range" };
  }
  if (flapTicks.length === 0 || flapTicks[0] !== 0) return { ok: false, reason: "Run must start with a flap" };
  for (let i = 1; i < flapTicks.length; i++) {
    if (!(flapTicks[i] > flapTicks[i - 1])) return { ok: false, reason: "Flaps must be in order" };
  }
  if (flapTicks[flapTicks.length - 1] >= crashTick) return { ok: false, reason: "Flap recorded after the crash" };

  const sim = createSimulation(seed);
  let next = 0;
  while (sim.tick < crashTick) {
    if (next < flapTicks.length && flapTicks[next] === sim.tick) {
      flap(sim);
      next += 1;
    }
    const events = step(sim);
    if (events.crashed) {
      return sim.tick === crashTick ? { ok: true, score: sim.score, ticks: sim.tick } : { ok: false, reason: "Run crashed at a different tick" };
    }
  }
  return { ok: false, reason: "Run did not crash where reported" };
}
