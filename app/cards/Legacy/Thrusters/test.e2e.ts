import { expect } from "@playwright/test";
import { test } from "@thorium/test/playwright.fixtures";

test("Required Thrusters", async ({ loadCard, page, browser }) => {
	const requiredAngle = 3;
	await loadCard("LegacyThrusters");

	const corePage = await browser.newPage();

	await corePage.goto("/flight/core/preview/LegacyThrusterCore");
	await expect(corePage.getByText("Yaw")).toBeVisible();
	await expect(corePage.getByTestId("yaw-value")).toHaveText("0˚");
	await expect(corePage.getByTestId("yaw-required")).toHaveText("0˚");
	corePage.on("dialog", (dialog) => dialog.accept(`${requiredAngle}`));
	await corePage.getByTestId("yaw-required").click();
	await expect(corePage.getByTestId("yaw-required")).toHaveText(`${requiredAngle}˚`);
	await expect(corePage.getByTestId("yaw-required")).toHaveClass(/bg-red-500/);

	await page.getByTestId("rotate-yaw").hover();
	await page.mouse.down();
	await page.getByText("Yaw Starboard").hover({ force: true, position: { x: -30, y: 0 } });

	await page.waitForTimeout(500);
	await page.mouse.up();

	await expect(page.getByTestId("indicator-Yaw")).not.toHaveText(`Yaw: 0˚`);

	await expect(corePage.getByTestId("yaw-value")).not.toHaveText(`0˚`);
});
test("Direction Thrusters", async ({ loadCard, page, browser }) => {
	await loadCard("LegacyThrusters");

	const corePage = await browser.newPage();

	await corePage.goto("/flight/core/preview/LegacyThrusterCore");

	await expect(corePage.getByTestId("direction-down")).toHaveCSS("color", "oklch(0 0.2203 256.91)");

	await page.getByTestId("direction-updown").hover();
	await page.mouse.down();
	await page.getByText("Down", { exact: true }).hover({ force: true });

	await expect(corePage.getByTestId("direction-down")).not.toHaveCSS(
		"color",
		"oklch(0 0.2203 256.91)",
	);

	await page.mouse.up();

	await expect(corePage.getByTestId("direction-down")).toHaveCSS("color", "oklch(0 0.2203 256.91)");
});
