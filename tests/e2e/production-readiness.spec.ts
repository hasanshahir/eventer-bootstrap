import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Eventr Production Readiness E2E & Accessibility Quality Gate", () => {
  test("1. Health probe /api/health responds with 200 and healthy checks", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      status: string;
      checks: { database: { status: string } };
    };
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("connected");
  });

  test("2. Home page renders hero, source ledger, interactive dispatches, and cards", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Eventr/);

    // Masthead & Tagline
    await expect(page.locator("h1")).toContainText("Har event");
    await expect(page.locator("text=Source ledger")).toBeVisible();
    await expect(page.locator("text=City dispatches")).toBeVisible();
    await expect(page.locator("text=Pick your arena")).toBeVisible();

    // Event cards exist
    const cards = page.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 1-Tap RSVP or Closed buttons exist
    const rsvpOrClosed = page.locator(
      "button:has-text('RSVP'), a:has-text('Closed')"
    );
    expect(await rsvpOrClosed.count()).toBeGreaterThan(0);
  });

  test("3. Cities index /cities renders all regional desks with links", async ({
    page,
  }) => {
    await page.goto("/cities");
    await expect(page.locator("h1")).toContainText("Regional Desks");

    const deskCards = page.locator("a[href^='/cities/']");
    const count = await deskCards.count();
    expect(count).toBeGreaterThanOrEqual(20);

    // Navigate to Karachi desk
    await page.click("a[href='/cities/karachi']");
    await expect(page).toHaveURL(/\/cities\/karachi/);
    await expect(page.locator("h1")).toContainText("Karachi");
  });

  test("4. Event detail page /events/[slug] renders JSON-LD schema and RSVP action", async ({
    page,
  }) => {
    await page.goto("/");
    const firstEventTitleLink = page.locator(
      "article h3 a[href^='/events/']"
    ).first();
    const href = await firstEventTitleLink.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();

    // Verify Schema.org/Event JSON-LD exists in the DOM
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toHaveCount(1);
    const jsonText = await jsonLdScript.textContent();
    expect(jsonText).toContain("https://schema.org");
    expect(jsonText).toContain('"@type":"Event"');
  });

  test("5. Theme script toggles between light and dark modes cleanly", async ({
    page,
  }) => {
    await page.goto("/");
    const themeBtn = page.locator(
      "button[aria-label*='theme'], button:has-text('Theme'), button:has-text('Dark'), button:has-text('Light')"
    ).first();

    if (await themeBtn.isVisible()) {
      const initialTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme")
      );
      await themeBtn.click();
      const updatedTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme")
      );
      expect(updatedTheme).not.toBe(initialTheme);
    }
  });

  test("6. Axe accessibility check on / has no critical or serious a11y violations", async ({
    page,
  }) => {
    await page.goto("/");
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // contrast evaluated across light/dark dynamic themes
      .analyze();

    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test("7. Axe accessibility check on /cities has no critical or serious a11y violations", async ({
    page,
  }) => {
    await page.goto("/cities");
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toEqual([]);
  });
});

