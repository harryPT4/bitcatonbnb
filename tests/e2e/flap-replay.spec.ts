import { expect, test, type Page } from "@playwright/test";
import {
  createSimulation,
  decodeFlaps,
  encodeFlaps,
  flap,
  FLAP_HEIGHT,
  MAX_RUN_TICKS,
  replayRun,
  seedFromRunId,
  step,
} from "../../src/features/flap/simulation";

const RUN_ID = "9f3c2a71-5b8e-4d2c-9a1f-2e6b7c8d9e0f";

/** A simple autopilot: flap when the cat drops below the next gap's centre. */
function playBot(seed: number, maxTicks = 60 * 90) {
  const sim = createSimulation(seed);
  const flaps: number[] = [];
  while (!sim.crashed && sim.tick < maxTicks) {
    const next = sim.pipes.find((pipe) => pipe.x + 78 > sim.cat.x);
    const target = next ? next.top + next.gap / 2 + 12 : FLAP_HEIGHT * 0.45;
    if (sim.tick === 0 || (sim.cat.y + sim.cat.h / 2 > target && sim.cat.vy > 0)) {
      flaps.push(sim.tick);
      flap(sim);
    }
    step(sim);
  }
  return { flaps, ticks: sim.tick, score: sim.score, crashed: sim.crashed };
}

test.describe("Flap replay verification", () => {
  // Pure logic: run once, not once per browser project.
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium" || browserName !== "chromium", "pure logic; runs in one project");
  });

  test("a recorded run replays to the same score and crash tick", () => {
    const seed = seedFromRunId(RUN_ID);
    const run = playBot(seed);
    expect(run.crashed).toBe(true);
    expect(run.score).toBeGreaterThan(0);

    const replay = replayRun(seed, decodeFlaps(encodeFlaps(run.flaps)), run.ticks);
    expect(replay).toEqual({ ok: true, score: run.score, ticks: run.ticks });
  });

  test("tampered inputs, inflated scores, and other seeds are rejected", () => {
    const seed = seedFromRunId(RUN_ID);
    const run = playBot(seed);

    const dropped = run.flaps.filter((_, i) => i !== Math.floor(run.flaps.length / 2));
    const droppedReplay = replayRun(seed, dropped, run.ticks);
    expect(droppedReplay.ok && droppedReplay.score === run.score).toBe(false);

    expect(replayRun(seed, run.flaps, run.ticks + 600).ok).toBe(false);
    expect(replayRun(seed, [5, ...run.flaps.slice(1)], run.ticks).ok).toBe(false);
    expect(replayRun(seed, [0, 10, 10], run.ticks).ok).toBe(false);
    expect(replayRun(seed, run.flaps, MAX_RUN_TICKS + 1).ok).toBe(false);

    const otherSeed = replayRun(seedFromRunId("00000000-5b8e-4d2c-9a1f-2e6b7c8d9e0f"), run.flaps, run.ticks);
    expect(otherSeed.ok && otherSeed.score === run.score).toBe(false);
  });
});

async function mockLeaderboard(page: Page) {
  await page.route("**/api/games/flap/leaderboard**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, board: [] }) }),
  );
}

test("a run played in the browser is reproduced exactly by the server replay", async ({ page }) => {
  const wallet = `0x${"f".repeat(40)}`;
  await mockLeaderboard(page);
  await page.route("**/api/games/flap/runs", (route) =>
    route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, runId: RUN_ID }) }),
  );
  let submission: { runId: string; mcap: number; ticks: number; flaps: number[] } | null = null;
  await page.route("**/api/games/flap/scores", async (route) => {
    submission = route.request().postDataJSON();
    const replay = replayRun(seedFromRunId(submission!.runId), decodeFlaps(submission!.flaps), submission!.ticks);
    const verified = replay.ok && replay.score === submission!.mcap;
    await route.fulfill({
      status: verified ? 200 : 422,
      contentType: "application/json",
      body: JSON.stringify(verified ? { ok: true, rank: 1 } : { ok: false, error: "mismatch" }),
    });
  });

  await page.addInitScript((w) => localStorage.setItem("bitcat_wallet", w), wallet);
  await page.goto("/games/flap");
  await expect(page.locator("#gameStatus")).toHaveText(/Game ready/);
  await page.getByRole("button", { name: "Start game" }).click();
  // Flap on an uneven rhythm so the run has many inputs at varied ticks before crashing.
  for (let i = 0; i < 14 && (await page.locator("#flapButton").textContent()) !== "Play again"; i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(260 + (i % 3) * 70);
  }

  await expect(page.locator("#publishButton")).toHaveText("Score published", { timeout: 20_000 });
  expect(submission).not.toBeNull();
  expect(submission!.flaps.length).toBeGreaterThan(1);
});

test("an offline run can be played but not published", async ({ page }) => {
  await mockLeaderboard(page);
  await page.route("**/api/games/flap/runs", (route) => route.fulfill({ status: 503, body: "" }));
  let scorePosts = 0;
  await page.route("**/api/games/flap/scores", (route) => {
    scorePosts += 1;
    return route.fulfill({ status: 500, body: "" });
  });

  await page.addInitScript(() => localStorage.setItem("bitcat_wallet", `0x${"1".repeat(40)}`));
  await page.goto("/games/flap");
  await expect(page.locator("#gameStatus")).toHaveText(/Game ready/);
  await page.getByRole("button", { name: "Start game" }).click();

  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#publishButton")).toBeDisabled();
  expect(scorePosts).toBe(0);
});
