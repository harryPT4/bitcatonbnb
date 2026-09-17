import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The game script is injected after hydration; wait for it before interacting to avoid clicks landing too early.
async function openGame(page: Page) {
  await page.goto("/games/flap");
  await expect(page.locator("#gameStatus")).toHaveText(/Game ready/);
}

for (const path of ["/", "/games/flap"]) {
  test(`${path} is public and has no serious accessibility violations`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
    expect(serious).toEqual([]);
  });
}

test("Flap API cannot be redirected by a query parameter", async ({ page }) => {
  const offOrigin: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "example.com") offOrigin.push(request.url());
  });
  await page.route("**/api/games/flap/runs", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, runId: "77777777-7777-4777-8777-777777777777" }),
    }),
  );
  const scoreRequest = page.waitForRequest((request) => request.url().includes("/scores") && request.method() === "POST");

  await page.addInitScript(() => localStorage.setItem("bitcat_wallet", `0x${"e".repeat(40)}`));
  await page.goto("/games/flap?api=https://example.com/collect");
  await expect(page.locator("#gameStatus")).toHaveText(/Game ready/);
  await page.getByRole("button", { name: "Start game" }).click();

  expect(new URL((await scoreRequest).url()).pathname).toBe("/api/games/flap/scores");
  expect(offOrigin).toEqual([]);
});

test("the landing page promotes the game in primary and mobile navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Play BITCAT Flap/i })).toBeVisible();
  await expect(page.locator('.mobile-actions a[href="/games/flap"]')).toHaveText("Play");
});

for (const legacyPath of ["/play", "/play.html"]) {
  test(`${legacyPath} opens the integrated Flap game`, async ({ page }) => {
    await page.goto(legacyPath);
    await expect(page).toHaveURL(/\/games\/flap$/);
    await expect(page.getByRole("heading", { name: "BITCAT Flap" })).toBeAttached();
  });
}

test("guests can start playing without a wallet", async ({ page }) => {
  await openGame(page);
  const start = page.getByRole("button", { name: "Start game" });
  await expect(page.locator("#walletMsg")).toContainText("Guest mode ready");
  await start.click();
  await expect(page.getByRole("button", { name: "Flap" })).toBeVisible();
});

test("wallet players automatically publish their peak score when REKT", async ({ page }) => {
  const runId = "11111111-1111-4111-8111-111111111111";
  const wallet = `0x${"a".repeat(40)}`;

  await page.route("**/api/games/flap/leaderboard", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, board: [] }) }),
  );
  await page.route("**/api/games/flap/runs", (route) =>
    route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, runId }) }),
  );
  await page.route("**/api/games/flap/scores", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, rank: 1 }) }),
  );

  await openGame(page);
  await page.locator("#wallet").fill(wallet);
  const scoreRequest = page.waitForRequest(
    (request) => request.url().endsWith("/api/games/flap/scores") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Start game" }).click();

  const submission = (await scoreRequest).postDataJSON();
  expect(submission).toMatchObject({ runId, wallet });
  expect(submission.mcap).toBeGreaterThanOrEqual(0);
  expect(submission.ticks).toBeGreaterThan(0);
  expect(submission.flaps[0]).toBe(0);
});

test("a published score cannot be published again with the same run token", async ({ page }) => {
  const wallet = `0x${"b".repeat(40)}`;
  let scorePosts = 0;

  await page.route("**/api/games/flap/leaderboard", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, board: [] }) }),
  );
  await page.route("**/api/games/flap/runs", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, runId: "22222222-2222-4222-8222-222222222222" }),
    }),
  );
  await page.route("**/api/games/flap/scores", (route) => {
    scorePosts += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, rank: 1 }) });
  });

  await openGame(page);
  await page.locator("#wallet").fill(wallet);
  await page.getByRole("button", { name: "Start game" }).click();

  const publish = page.locator("#publishButton");
  await expect(publish).toHaveText("Score published");
  await expect(publish).toBeDisabled();
  expect(scorePosts).toBe(1);
});

test("Space on other controls does not flap", async ({ page }) => {
  await openGame(page);
  await page.locator("#refreshBoard").focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Start game" })).toBeVisible();
});

test("the game still starts when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await openGame(page);
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByRole("button", { name: "Flap" })).toBeVisible();
});

test("players can pause with the keyboard and the game auto-pauses when hidden", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Start game" }).click();
  await page.keyboard.press("p");
  const resume = page.getByRole("button", { name: "Resume" });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.getByRole("button", { name: "Flap" })).toBeVisible();

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(resume).toBeVisible();
});

test("the mute preference is remembered", async ({ page }) => {
  await openGame(page);
  const mute = page.getByRole("button", { name: "Mute sound" });
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await mute.click();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Mute sound" })).toHaveAttribute("aria-pressed", "true");
});

test("the leaderboard pins the player's own rank and refreshes past the HTTP cache after publishing", async ({ page }) => {
  const wallet = `0x${"cd".repeat(20)}`;
  const board = Array.from({ length: 14 }, (_, i) => ({
    rank: i + 1,
    wallet: i === 12 ? wallet : `0x${String(i % 10).repeat(40)}`,
    mcap: (15 - i) * 300_000,
  }));
  const boardUrls: string[] = [];

  await page.route("**/api/games/flap/leaderboard**", (route) => {
    boardUrls.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, board }) });
  });
  await page.route("**/api/games/flap/runs", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, runId: "55555555-5555-4555-8555-555555555555" }),
    }),
  );
  await page.route("**/api/games/flap/scores", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, wallet, mcap: 600_000, rank: 13 }) }),
  );

  await openGame(page);
  await page.locator("#wallet").fill(wallet);
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator("#publishButton")).toHaveText("Score published");

  const rows = page.locator("#leaderboardList li:not(.leaderboard-gap)");
  await expect(rows).toHaveCount(11);
  await expect(page.locator("#leaderboardList li.is-you")).toContainText("#13");
  expect(boardUrls.some((url) => /leaderboard\?t=\d+/.test(url))).toBe(true);
});

test("the contract address can be copied", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openGame(page);
  await page.getByRole("button", { name: "Copy contract address" }).click();
  await expect(page.locator("#copyContract")).toHaveText("Copied ✓");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("0x7d1a8dbb40b7b5518ef69b93a6faeba91eea7777");
});
