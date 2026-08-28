import { expect, type Page } from "@playwright/test";
import type { AppRouter } from "@thorium/.server/init/router";
import { test } from "@thorium/test/playwright.fixtures";
import type { createLiveQueryReact } from "@thorium/utils/live-query/client";

async function login(page: Page) {
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Login Name").fill("Test User");
		await page.getByText("Login", { exact: true }).click();
	});
}

async function waitForTrainingAdvance(page: Page, callback: () => Promise<void>) {
	const textEl = page.getByTestId("training-text");
	const trainingText = await textEl.textContent();
	await callback();
	await expect(textEl).not.toHaveText(trainingText!);
}
async function waitForNext(page: Page) {
	await waitForTrainingAdvance(
		page,
		async () => await page.getByText("Next", { exact: true }).click(),
	);
}

async function waitForDone(page: Page, callback: () => Promise<void>) {
	const trainingEl = page.getByTestId("training-text");
	expect(trainingEl).toBeInViewport();
	await callback();
	expect(trainingEl).not.toBeInViewport();
}

test.setTimeout(1000 * 60 * 3);
test.skip("5 Station Pilot", async ({ startTraining, page, q }) => {
	await startTraining(5, "Pilot");

	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Login
	await login(page);
	// Step 3 - Pilot Summary
	await waitForNext(page);
	// Step 4 - Radar
	await waitForNext(page);
	// Step 5 - Radar Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Zoom").locator(".thumb").first().hover();
		await page.mouse.down();
		await page.mouse.move(-300, 0);
		await page.mouse.up();
	});
	// Step 6 - Tilt Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Tilt Radar View").click();
		await page.getByText("Tilt Radar View").click();
	});
	// Step 7 - Rotation Thrusters
	await waitForNext(page);
	// Step 8 - Play around with thrusters
	await waitForTrainingAdvance(page, async () => {
		await page.getByTestId("rotation-yaw").hover();
		await page.mouse.down();
		await page.getByText("Port Yaw").hover({ force: true, position: { x: -30, y: 0 } });

		await page.waitForTimeout(500);
		await page.mouse.up();
	});
	// Step 9 - Play around with direction
	await waitForTrainingAdvance(page, async () => {
		await page.getByTestId("direction-foreaft").hover();
		await page.mouse.down();
		await page.getByText("Fore").hover({ force: true, position: { x: 0, y: -30 } });

		await page.waitForTimeout(500);
		await page.mouse.up();
	});
	// Step 10 - Impulse
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "1/4 Impulse" }).click(),
	);
	// Step 11 - Impulse Slider
	await waitForNext(page); // Step 12 - Current Speed
	await waitForNext(page); // Step 13 - Warp
	await waitForNext(page); // Step 14 - Full Stop
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Full Stop" }).click(),
	);
	// Step 15 - Navigation
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-navigation").click(),
	);
	// step 16 - Navigation Overview
	await waitForNext(page);
	// Step 17 - Search Bar
	await waitForTrainingAdvance(page, async () => {
		await page.getByPlaceholder("Search Navigational Records...").fill("Mars");
		await page.getByText("Mars", { exact: true }).click();
	});
	// Step 18 - Navigation Object
	await waitForTrainingAdvance(page, async () => {
		page.getByText("Create Waypoint", { exact: true }).click();
		page.getByText("Create Waypoint", { exact: true }).click();
	});
	// Step 18.1 - Activate
	await waitForTrainingAdvance(page, async () =>
		page.getByText("Activate Waypoint", { exact: true }).click(),
	);
	// Step 18.2 - Return to Pilot
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-flight-controls").click(),
	);
	// Step 19 - Autopilot
	// We're going to fudge this one by automatically pointing the ship at the waypoint
	await waitForTrainingAdvance(page, async () => {
		const ship = await q.ship.player.netRequest({ clientId: "test" });
		const waypoints = await q.waypoints.all.netRequest({
			active: true,
			shipId: ship.id,
			systemId: "all",
		});
		const objectId = waypoints[0].id;

		if (!objectId) throw new Error("Mars not found");
		await q.ship.pointAt.netSend({ shipId: ship.id, objectId });
	});
	// Step 20 - Lock Course
	await waitForTrainingAdvance(page, async () =>
		page.getByText("Lock On Course", { exact: true }).click(),
	);
	// Step 21 - Activate Autopilot
	await waitForTrainingAdvance(page, async () =>
		page.getByText("Activate Autopilot", { exact: true }).click(),
	);
	// Step 22 - Traveling
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-navigation").click(),
	);
	// Step 23 - Navigation 2
	await waitForNext(page);
	// Step 24 - Waypoints
	await waitForNext(page);
	// Step 25 - Clear Waypoints
	await waitForNext(page);
	// Step 26 - Officers Log
	await waitForNext(page);
	// Step 27 - Objectives
	await waitForNext(page);

	// Step 28 - Settings
	await waitForNext(page);
	// Step 29 - Done
	await waitForDone(page, async () => {
		await page.getByText("Next", { exact: true }).click();
	});
});
test.skip("5 Station Tactical", async ({ startTraining, page, q }) => {
	await startTraining(5, "Tactical");

	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Login
	await login(page);
	// Step 3 - Radar Summary
	await waitForNext(page);
	// Step 4 - Radar
	await waitForNext(page);
	// Step 5 - Radar Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Zoom").locator(".thumb").first().hover();
		await page.mouse.down();
		await page.mouse.move(-300, 0);
		await page.mouse.up();
	});
	// Step 6 - Tilt Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Tilt Radar View").click();
		await page.getByText("Tilt Radar View").click();
	});
	// Step 7 - Hull
	await waitForNext(page);
	// Step 8 - Shields
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Raise Shields" }).click();
	});
	// Step 9 - Shields Raising
	await waitForNext(page);
	// Step 10 - Phasers
	await waitForNext(page);
	// Step 11 - Phasers 2
	await waitForTrainingAdvance(page, async () => {
		const el = page.getByLabel("Arc").locator(".thumb").first();
		const box = await el.boundingBox();
		if (!box) throw new Error("Arc thumb not found");
		await el.hover();
		await page.mouse.down();
		await page.mouse.move(box.x + box.width / 2 - 20, 0);
		await page.mouse.up();
	});
	// Step 12 - Torpedos
	await waitForNext(page);

	// Step 13 - Torpedo Options
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Photon Torpedo").click();
	});
	// Step 14 - Load Torpedo
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Load" }).click();
		await page.waitForTimeout(5000);
	});
	// Step 15 - Targets
	await waitForTrainingAdvance(page, async () => {
		const box = await page.locator(".contact-entity").boundingBox();
		if (!box) throw new Error("Contact not found");
		await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

		// Prep the phaser arc before firing
		const ship = await q.ship.player.netRequest({ clientId: "test" });
		const phasers = await q.targeting.phasers.list.netRequest({ shipId: ship.id });
		for (const phaser of phasers) {
			await q.targeting.phasers.setArc.netSend({ phaserId: phaser.id, arc: 36 });
		}
	});

	// Step 16 - Fire Phasers
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Full" }).first().hover();
		await page.mouse.down();
		await page.waitForTimeout(500);
		await page.mouse.up();
	});
	// Step 17 - Fire Torpedoes
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Fire" }).first().click();
	});
	// Step 18 - Weapons Done
	await waitForNext(page);

	// Step 19 - Remote Access
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".widget-RemoteAccess").click();
	});

	// Step 20 - Remote Access Input
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Remote Access Code").fill("RMT-TRN-184");
		await page
			.locator(".widget-body-RemoteAccess")
			.getByRole("button", { name: "Send", exact: true })
			.first()
			.click();
	});
	// Click anywhere to close the widget
	await page.mouse.click(50, 50);

	// Step 26 - Officers Log Widget

	await waitForNext(page);
	// Step 27 - Objectives Widget
	await waitForNext(page);

	// Step 28 - Settings Widget
	await waitForNext(page);

	// Step 29 - Done
	await waitForDone(page, async () => {
		await page.getByText("Next", { exact: true }).click();
	});
});
test.skip("5 Station Sensors", async ({ startTraining, page }) => {
	await startTraining(5, "Sensors");

	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Login
	await login(page);
	// Step 3 - Targeting Summary
	await waitForNext(page);
	// Step 4 - Radar
	await waitForNext(page);
	// Step 5 - Radar Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Zoom").locator(".thumb").first().hover();
		await page.mouse.down();
		await page.mouse.move(-300, 0);
		await page.mouse.up();
	});
	// Step 6 - Tilt Controls
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Tilt Radar View").click();
		await page.getByText("Tilt Radar View").click();
	});
	// Step 7 - Tilt Back
	await waitForNext(page);

	// Step 8 - Contacts
	await waitForNext(page);
	// Step 9 - Contacts List
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".objects-list").getByText("Unknown").click();
	});
	// Step 10 - Identification Scan
	await waitForTrainingAdvance(page, async () => {
		await page.getByTestId("begin-identification").click();
	});

	// Step 11 - Scan Progress
	await waitForNext(page);
	// Step 12 - Scan Range
	await waitForNext(page);
	// Step 13 - Scan Results
	await waitForNext(page);
	// Step 14 - Scan Options
	await waitForNext(page);
	// Step 15 - Good Scanning Practice
	await waitForNext(page);
	// Step 16 - Processed Data
	await waitForNext(page);
	// Step 26 - Officers Log Widget
	await waitForNext(page);
	// Step 27 - Objectives Widget
	await waitForNext(page);
	// Step 28 - Settings Widget
	await waitForNext(page);
	// Step 29 - Done
	await waitForDone(page, async () => {
		await page.getByText("Next", { exact: true }).click();
	});
});
test.skip("5 Station Operations", async ({ page, startTraining, q }) => {
	await startTraining(5, "Operations");

	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Login
	await login(page);

	// Step 3 - Short Range Comm
	await testShortRange(page);
	// Step 4 - Move to Long Range Comm
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-long-range-comm").click(),
	);
	// Step 5 - Long Range Comm
	await testLongRange(page);
	// Step 6 - Move to Documents
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-documents").click(),
	);
	// Step 7 - Documents
	await testDocuments(page);
	// Step 8 - Move to Cargo Control
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-cargo-control").click(),
	);
	// Step 9 - Cargo Control
	await testCargoControl(page, q);
	// Step 26 - Officers Log Widget
	await waitForNext(page);
	// Step 27 - Objectives Widget
	await waitForNext(page);
	// Step 28 - Settings Widget
	await waitForNext(page);
	// Step 29 - Done

	await waitForDone(page, async () => {
		await page.getByText("Next", { exact: true }).click();
	});
});
test("5 Station Engineer", async ({ page, startTraining, q }) => {
	await startTraining(5, "Engineer");

	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Login
	await login(page);
	// Step 3 - Systems Monitor Card
	await testSystemsMonitor(page);
	// Step 4 - Move to Coolant Loop Card
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-coolant-loop").click(),
	);
	// Step 5 - Coolant Loop
	await testCoolantLoop(page);
	// Step 6 - Move to Damage Reports Card
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-damage-reports").click(),
	);
	// Step 7 - Damage Reports
	await testDamageReports(page, q);
	// Step 6 - Move to Exocomps
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-exocomps").click(),
	);
	// Step 7 - Exocomps
	await testExocomps(page);
	// Step 8 - Move to Engineering Panel
	await waitForTrainingAdvance(
		page,
		async () => await page.locator("#card-button-engineering-panel").click(),
	);
	// Step 9 - Engineering Panels
	await testEngineeringPanels(page);

	// Step 26 - Officers Log Widget
	await waitForNext(page);
	// Step 27 - Objectives Widget
	await waitForNext(page);
	// Step 28 - Settings Widget
	await waitForNext(page);
	// Step 29 - Done

	await waitForDone(page, async () => {
		await page.getByText("Next", { exact: true }).click();
	});
});

async function testShortRange(page: Page) {
	// Step 1 - Short Range Intro
	await waitForNext(page);

	// Step 2 - Frequency Slider
	await waitForNext(page);
	// Step 3 - Gain Slider
	await waitForNext(page);
	// Step 4 - Incoming Hail
	await waitForTrainingAdvance(page, async () => await page.getByLabel("Frequency").fill("180"));
	// Step 5 - Connect Hail
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Connect" }).click(),
	);
	// Step 6 - Conversation Tree
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Nice to meet you." }).click(),
	);
	// Step 7 - Prepare Hail
	await waitForTrainingAdvance(page, async () => await page.getByLabel("Frequency").fill("232"));
	// Step 8 - Initiate Hail
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Hail" }).click(),
	);
	// Step 9 - Wait for connect

	// Step 9 - Disconnect
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Disconnect" }).click(),
	);
}

async function testLongRange(page: Page) {
	// Step 1 - Intro
	await waitForNext(page);

	// Step 2 - Incoming Messages
	await waitForTrainingAdvance(page, async () => await page.getByText("Target Ship").click());
	// Step 3 - Encoded Message
	await waitForNext(page);

	// Step 4 - Rotation Decoding
	await waitForNext(page);

	// Step 5 - Add New Messages

	// Step 6 - Waves Decoding
	await waitForNext(page);
	// Step 7 - Replacement Decoding
	await waitForNext(page);

	// Step 8 - Composer
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Compose Message" }).click(),
	);

	// Step 9 - Address Book
	await waitForTrainingAdvance(page, async () => {
		await page.getByPlaceholder("Search Address Book").fill("Target");
		await page.keyboard.press("ArrowDown");
		await page.getByLabel("Target Ship").getByText("Target Ship", { exact: true }).click();
	});

	// Step 10 - Write Message
	await waitForTrainingAdvance(page, async () => {
		await page.getByLabel("Message:").fill("This is a test message.");
		await page.getByText("Next", { exact: true }).click();
	});
	// Step 11 - Queue Message
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Queue Message" }).click();
	});
	// Step 12 - Outbox
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Outbox" }).click(),
	);
	// Step 13 - Outbox Page
	await waitForNext(page);

	// Step 14 - Satellite Radar
	await waitForNext(page);

	// Step 15 - Frequency Gain Sliders
	await waitForNext(page);

	// Step 16 - Message List
	await waitForTrainingAdvance(
		page,
		async () => await page.getByText("Target ShipOperations").click(),
	);

	// Step 17 - Pick Satellite
	await waitForTrainingAdvance(page, async () => {
		const box = await page.locator(".satellite-entity").first().boundingBox();
		if (!box) throw new Error("Contact not found");
		await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	});
	// Step 18 - Message Encoding
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Send Message" }).click(),
	);

	// Step 19 - Sent
	await waitForTrainingAdvance(
		page,
		async () => await page.getByRole("button", { name: "Sent" }).click(),
	);
	// Step 20 - Sent Page
	await waitForNext(page);
}

async function testDocuments(page: Page) {
	// Step 1
	await waitForNext(page);

	// Step 2 - Documents List
	await waitForTrainingAdvance(
		page,
		async () => await page.getByText("Intercepted Message", { exact: true }).click(),
	);
	// Step 3 - Document Viewer
	await waitForNext(page);

	// Step 4 - Code Cyphers
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".widget-CodeCyphers").click();
	});
	// Step 6 - Break out
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Break Out Widget").click();
	});
	// Step 4 - Cyphers List
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("WVXH-213", { exact: true }).first().click();
	});
	// Step 5 - Cypher
	await page.getByText("Close Widget").click();
	await waitForNext(page);

	// Step 7 - Annotations
	await waitForNext(page);

	// Step 8 - Other Documents
	await waitForNext(page);
}

async function testCargoControl(
	page: Page,
	q: ReturnType<typeof createLiveQueryReact<AppRouter>>[0],
) {
	// Step 1
	await waitForNext(page);

	// Step 2 - Deck View
	await waitForTrainingAdvance(page, async () => {
		await page.getByTestId("room-dot").first().click();
	});
	// Step 3 - Deck Picker
	await waitForTrainingAdvance(page, async () => {
		const textEl = page.getByTestId("training-text");
		const trainingText = await textEl.textContent();

		// Figure out which deck we need to visit.
		const deck = trainingText?.match(/Go ahead and switch to (.*?)\./)?.[1];
		if (!deck) throw new Error("Deck not found");
		await page.getByText(deck, { exact: true }).click();
	});

	// Step 4 - Pick Room
	await waitForTrainingAdvance(page, async () => {
		const textEl = page.getByTestId("training-text");
		const trainingText = await textEl.textContent();
		// Figure out which room we need to select.
		const room = trainingText?.match(/Now choose (.*?)\./)?.[1];
		if (!room) throw new Error("Room not found");

		await page.locator(".deck-on").getByLabel(room, { exact: true }).first().click();
	});
	// Step 5 - Cargo List
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Summon Closest Container" }).click();
	});
	// Step 6 - Container Moving
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".cargo-container.moving").click();
	});
	// Step 7 - Container Arrived
	await waitForTrainingAdvance(page, async () => {
		const { id: shipId } = await q.ship.player.netRequest({ clientId: "test" });
		const containers = await q.cargoControl.containers.netRequest({ shipId });
		const movingContainer = containers.find((c) => c.entityState === "enRoute");
		if (!movingContainer) throw new Error("Unable to find moving container.");
		await q.cargoControl.containerMoveToRoomInstant.netSend({ containerId: movingContainer.id });
	});
	// Step 8 - Transfer Cargo
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Ale Glass (4 / unit)", { exact: true }).click();
	});

	// Step 9 - Move Container
	await waitForNext(page);

	// Step 10 - Search
	await waitForNext(page);
}

async function testSystemsMonitor(page: Page) {
	// Step 1 - Intro
	await waitForNext(page);
	// Step 2 - Reactors
	await waitForNext(page);
	// Step 3 - Power Output
	await waitForNext(page);
	// Step 4 - Heat
	await waitForNext(page);
	// Step 5 - Efficiency
	await waitForNext(page);
	// Step 6 - Fuel
	await waitForNext(page);
	// Step 7 - Reactor Summary
	await waitForNext(page);
	// Step 8 - Batteries
	await waitForNext(page);
	// Step 9 - Battery Capacity
	await waitForNext(page);
	// Step 10 - Battery Output
	await waitForNext(page);
	// Step 11 - Net Charge
	await waitForNext(page);
	// Step 12 - Battery Activate
	await waitForNext(page);
	// Step 13 - Battery Summary
	await waitForNext(page);
	// Step 14 - Ship Systems
	await waitForNext(page);
	// Step 15 - Systems Power
	await waitForNext(page);
	// Step 16 - Deactivate Systems
	await waitForNext(page);
	// Step 17 - System Battery
	await waitForNext(page);
	// Step 18 - System Heat
	await waitForNext(page);
	// Step 19 - Sort Buttons
	await waitForNext(page);
	// Step 20 - Phase Capacitors
	await waitForNext(page);
	// Step 21 - Summary
	await waitForNext(page);
}
async function testCoolantLoop(page: Page) {
	// Step 1 - Intro
	await waitForNext(page);

	// Step 2 - Coolant Pump
	await waitForNext(page);

	// Step 3 - Coolant Pump Speed
	await waitForTrainingAdvance(page, async () => {
		const thumbEl = page.getByLabel("Pump Speed").locator(".thumb").first();
		const bb = await thumbEl.boundingBox();
		if (!bb) throw new Error("Pump Speed slider not found");
		await thumbEl.hover();
		await page.mouse.down();
		await page.mouse.move(1000, 0);
		await page.mouse.up();
	});
	// Step 4 - Coolant Systems
	await waitForNext(page);

	// Step 5 - Cool System
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".coolant-system-sensors").getByLabel("Open coolant valve").hover();
		await page.mouse.down();
		await page.waitForTimeout(500);
		await page.mouse.up();
	});
	// Step 6 - Done Cooling
	await waitForNext(page);

	// Step 7 - Coolant Tank
	await waitForNext(page);

	// Step 8 - Radiator
	await waitForNext(page);

	// Step 9 - Radiator Bypass
	await waitForNext(page);
}
async function testDamageReports(
	page: Page,
	q: ReturnType<typeof createLiveQueryReact<AppRouter>>[0],
) {
	// Step 1
	await waitForNext(page);

	// Step 2 - Systems List
	await waitForTrainingAdvance(page, async () => {
		await page.locator("#DamageReports").getByText("Warp Engines").click();
	});
	// Step 3 - Diagnostics
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Level 3 Diagnostic" }).click();
	});
	// Step 4 - Wait for Diagnostic
	await waitForTrainingAdvance(page, async () => {
		const ship = await q.ship.player.netRequest({ clientId: "test" });
		const systems = await q.damageReports.systems.netRequest({ shipId: ship.id });
		const system = systems.find((s) => s.name === "Warp Engines");
		const systemId = system?.id || -1;
		const diagnostic = await q.damageReports.systemDiagnostic.netRequest({ systemId });
		const diagnosticId = diagnostic?.id || -1;
		await q.damageReports.diagnosticFinishEarly.netSend({ diagnosticId });

		await waitForNext(page);
	});
	// Step 4 - Damage Metrics
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Generate Reports" }).first().click();
	});

	// Step 5 - Damage Report Candidates
	await waitForNext(page);

	// Step 6 - Damage Report Lists
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Exocomp Repair", { exact: true }).click();
	});

	// Step 7 - Damage Report Text
	await waitForNext(page);

	// Step 8 - Abort Report
	await waitForNext(page);

	// Step 8 - Damage Report Widget
	await waitForTrainingAdvance(page, async () => {
		await page.locator(".widget-DamageReports").click();
	});

	// Click anywhere to close the widget
	await page.mouse.click(50, 50);
}
async function testExocomps(page: Page) {
	// Step 1 - Intro
	await waitForNext(page);

	// Step 2 - Deck Display
	await waitForNext(page);

	// Step 3 - Deck List
	await waitForNext(page);

	// Step 4 - Exocomps
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Choose Exocomp" }).first().click();
	});
	// Step 5 - Exocomp Location
	await waitForNext(page);

	// Step 6 - Exocomp Instructions
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Exocomp Instruction 0" }).click();
	});

	// Step 7 - Instruction Types
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Retrieve Cargo" }).click();
	});

	// Step 8 - Retrieve Cargo
	await waitForTrainingAdvance(page, async () => {
		await page.getByText("Coaxial Servo", { exact: true }).click();
		await page.getByRole("button", { name: "Set Instruction" }).click();
	});

	// Step 9 - Go to Instruction
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Exocomp Instruction 1" }).click();
	});
	// Step 10 - Go To
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Go To" }).click();
	});
	// Step 11 - Go To Destination
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Select Deck Deck" }).click();
		await page.getByRole("option", { name: "Deck 1", exact: true }).click();
		await page.getByRole("button", { name: "Select Room Room" }).click();
		await page.getByRole("option", { name: "Observation Deck" }).click();
		await page.getByRole("button", { name: "Set Instruction" }).click();
	});
	// Step 12 - Use Cargo Instruction
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Exocomp Instruction 2" }).click();
	});
	// Step 13 - Use Cargo
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Use Cargo" }).click();
	});
	// Step 14 - Tighten Instruction
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Exocomp Instruction 3" }).click();
	});
	// Step 15 - Tighten
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Tighten" }).click();
	});
	// Step 16 - Tighten Duration
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Set Instruction" }).click();
	});
	// Step 17 - Deploy
	await waitForTrainingAdvance(page, async () => {
		await page.getByRole("button", { name: "Deploy" }).click();
	});

	// Step 18 - Conclusion
	await waitForNext(page);
}
async function testEngineeringPanels(page: Page) {
	// Step 1
	await waitForNext(page);

	// Step 2 - Cell Basics
	await waitForNext(page);

	// Step 3 - Press Button
	await waitForNext(page);

	// Step 4 - Switch
	await waitForNext(page);

	// Step 5 - Tri Switch
	await waitForNext(page);

	// Step 6 - Numbered Slider
	await waitForNext(page);

	// Step 7 - Number Input
	await waitForNext(page);

	// Step 8 - Cables
	await waitForNext(page);

	// Step 9 - Conclusion
	await waitForNext(page);
}
