import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { test as base } from "@playwright/test";
import type { AppRouter } from "@thorium/.server/init/router";
import { createLiveQueryReact } from "@thorium/utils/live-query/client";
import getPort from "get-port";
export const test = base.extend<
	{
		forEachTest: void;
		loadLegacyCard: (cardName: string) => Promise<void>;
		startTraining: (crewCount: number, stationName: string) => Promise<void>;
		stationLogin: () => Promise<void>;
	},
	{
		serverURL: string;
		q: ReturnType<typeof createLiveQueryReact<AppRouter>>[0];
	}
>({
	serverURL: [
		// oxlint-disable-next-line no-empty-pattern
		async ({}, use) => {
			let port = 3000;
			try {
				const abortController = new AbortController();

				if (process.env.CI) {
					port = await getPort();

					const targetArch =
						process.arch === "arm64" ? "aarch64" : process.arch === "x64" ? "x86_64" : "unknown";
					const targetPlatform =
						process.platform === "darwin"
							? "apple-darwin"
							: process.platform === "linux"
								? "unknown-linux-gnu"
								: process.platform === "win32"
									? "pc-windows-msvc"
									: "unknown";
					const binaryName = `server-${targetArch}-${targetPlatform}`;

					// Copy Thorium Plugin data into a new folder
					await mkdir(`./test-data/worker-${port}/plugins/`, {
						recursive: true,
					});
					await mkdir(`./test-data/worker-${port}/flights/`, {
						recursive: true,
					});
					await cp(
						"./data/plugins/Thorium Default",
						`./test-data/worker-${port}/plugins/Thorium Default`,
						{ recursive: true },
					);
					const server = await Promise.race([
						new Promise<ChildProcessWithoutNullStreams>((res, rej) => {
							const server = spawn(`./binaries/${binaryName}`, [], {
								env: {
									PATH: process.env.PATH,
									PORT: port.toString(),
									NODE_ENV: "test",
									THORIUM_PATH: `/test-data/worker-${port}`,
								},
								signal: abortController.signal,
							});
							function errorListener(error: any) {
								rej(error);
							}
							function dataListener(data: any) {
								if (data.toString().includes("Server running on")) {
									server.stdout.off("data", dataListener);
									server.off("error", errorListener);
									res(server);
								}
							}
							server.stdout.on("data", dataListener);
							server.on("error", errorListener);
						}),
						new Promise<ChildProcessWithoutNullStreams>((res, rej) =>
							setTimeout(rej, 3000, "Starting server timed out"),
						),
					]);
					server.on("error", (error) => {
						if (error.name !== "AbortError") {
							console.error(error);
						}
					});
				}
				await use(`http://localhost:${port}`);

				abortController.abort();
			} finally {
				await rm(path.resolve(`./test-data/worker-${port}`), {
					recursive: true,
					force: true,
				});
			}
		},
		{ auto: true, scope: "worker" },
	],
	q: [
		async ({ serverURL }, use) => {
			const [q] = createLiveQueryReact<AppRouter>({
				baseUrl: serverURL,
				headers: async () => ({
					"client-id": "test",
				}),
			});
			await use(q);
		},
		{ scope: "worker" },
	],
	baseURL: [
		async ({ serverURL }, use) => {
			await use(serverURL);
		},

		// @ts-expect-error
		{ scope: "test", option: true },
	],
	forEachTest: [
		async ({ q, page }, use) => {
			await q.flight.stop.netSend();
			await page.context().addInitScript(() => {
				window.sessionStorage.setItem("test-clientId", "test");
			});
			await use();
		},
		{ auto: true, scope: "test" },
	],
	loadLegacyCard: async ({ q, page }, use) => {
		await use(async (cardName: string) => {
			await q.flight.start.netSend({
				flightName: "Test",
				hasFlightDirector: true,
				mode: "legacy",
				ships: [
					{
						shipName: "Testing",
						crewCount: 1,
						shipTemplate: {
							pluginId: "Thorium Default",
							shipId: "Astra Frigate",
						},
					},
				],
			});
			await q.client.testStation.netSend({
				clientId: "test",
				component: cardName,
			});
			await page.goto("/flight/station");
		});
	},
	startTraining: async ({ q, page }, use) => {
		await q.flight.stop.netSend();
		await page.goto("/flight/station");

		await use(async (crewCount, stationId) => {
			await q.flight.start.netSend({
				flightName: "Test",
				hasFlightDirector: true,
				mode: "nova",
				ships: [
					{
						shipName: "Testing",
						crewCount: crewCount,
						shipTemplate: {
							pluginId: "Thorium Default",
							shipId: "Astra Frigate",
						},
					},
				],
			});
			const playerShips = await q.ship.players.netRequest();
			const shipId = playerShips[0].id;
			await q.client.setStation.netSend({
				clientId: "test",
				shipId,
				stationId,
			});

			await q.client.startTraining.netSend({ clientId: "test" });
		});

		await q.flight.stop.netSend();
	},
});
