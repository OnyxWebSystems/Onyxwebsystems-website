import { test, expect } from "@playwright/test";

test.describe("Customer Experience demo smoke", () => {
  test("login page renders product name", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Customer Experience" })).toBeVisible();
    await expect(page.getByText("AI Receptionist")).toHaveCount(0);
  });
});
