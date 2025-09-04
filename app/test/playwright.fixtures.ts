import { test as base, type BrowserContext, type Page } from "@playwright/test";

import type { AppRouter } from "@thorium/.server/init/router";
import { createLiveQueryReact } from "@thorium/utils/live-query/client";
import getPort from "get-port";
import { cp, mkdir, rm } from "node:fs/promises";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
export const test = base.extend<
	{
		// biome-ignore lint/suspicious/noConfusingVoidType:
		forEachTest: void;
	},
	{
		serverURL: string;
		q: ReturnType<typeof createLiveQueryReact<AppRouter>>;
	}
>({
	serverURL: [
		async ({ headless }, use) => {
			let port = 3000;
			try {
				const abortController = new AbortController();

				if (process.env.CI) {
					port = await getPort();

					const targetArch =
						process.arch === "arm64"
							? "aarch64"
							: process.arch === "x64"
								? "x86_64"
								: "unknown";
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
							setTimeout(rej, 2000, "Starting server timed out"),
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
			const q = createLiveQueryReact<AppRouter>({
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
			use(serverURL);
		},
		{ scope: "test" },
	],
	forEachTest: [
		async ({ q }, use) => {
			await q.flight.stop.netSend();

			await use();
		},
		{ auto: true, scope: "test" },
	],
});
