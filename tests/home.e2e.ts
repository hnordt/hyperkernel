import { test, expect } from "@playwright/test";

test("renders the Hyperkernel home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Hyperkernel");
  await expect(
    page.getByRole("heading", { level: 1, name: "Hello, world" }),
  ).toBeVisible();
});
