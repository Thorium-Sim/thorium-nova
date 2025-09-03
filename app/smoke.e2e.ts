import { expect, test } from "@playwright/test";

test("It should load the app", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText("Thorium Nova")).toBeVisible();
});
