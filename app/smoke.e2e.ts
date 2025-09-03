import { expect, test } from "@playwright/test";

test("It should load the app", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText("Thorium Nova")).toBeVisible();
});
test("It should start a Nova mode flight", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByText("Start Flight")).toBeVisible();
});
