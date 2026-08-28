import { expect } from "@playwright/test";
import { test } from "@thorium/test/playwright.fixtures";

test("It should load the app", async ({ page, serverURL }) => {
	console.info(serverURL);
	await page.goto("/");

	await expect(page.getByText("Thorium Nova")).toBeVisible();
});
test("It should start a Nova mode flight", async ({ page }) => {
	await page.goto("/flight/quick/ship");
	await page.getByText("Nova", { exact: true }).click();
	await page.getByText("Next").click();
	await page.getByText("Sandbox", { exact: true }).click();
	await page.getByText("Earth", { exact: true }).click();
	await page.getByText("Start", { exact: true }).click();
	await expect(page.getByText("Flight Name")).toBeVisible();
	await expect(page.getByText("Flight Mode: Nova")).toBeVisible();
});

test("It should start a Legacy mode flight", async ({ page }) => {
	await page.goto("/flight/quick/ship");
	await page.getByText("Legacy", { exact: true }).click();
	await page.getByText("Next").click();
	await page.getByText("Sandbox", { exact: true }).click();
	await page.getByText("Start", { exact: true }).click();
	await expect(page.getByText("Flight Name")).toBeVisible();
	await expect(page.getByText("Flight Mode: Legacy")).toBeVisible();
});
