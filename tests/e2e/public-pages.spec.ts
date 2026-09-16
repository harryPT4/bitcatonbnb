import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
  await page.goto("/games/flap?api=https://example.com/collect");
  const source = await (await page.request.get("/scripts/flap-game.js")).text();
  expect(source).toContain('const API = "/api/games/flap"');
  expect(source).not.toContain("URLSearchParams");
});

test("the landing page promotes the game in primary and mobile navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Play BITCAT Flap/i })).toBeVisible();
  await expect(page.locator('.mobile-actions a[href="/games/flap"]')).toHaveText("Play");
});

test("guests can start playing without a wallet", async ({ page }) => {
  await page.goto("/games/flap");
  const start = page.getByRole("button", { name: "Start game" });
  await expect(page.locator("#walletMsg")).toContainText("Guest mode ready");
  await start.click();
  await expect(page.getByRole("button", { name: "Flap" })).toBeVisible();
});
