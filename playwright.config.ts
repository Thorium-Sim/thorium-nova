import { type PlaywrightTestConfig, devices } from "@playwright/test";

function envToBool(value: string | undefined) {
	if (!value) {
		return false;
	}

	return ["true", "1"].includes(value);
}

const TEST_SERVER_PORT = Number(process.env.PORT || "4010");
const IS_CI = envToBool(process.env.CI);
const NO_SERVER = envToBool(process.env.NO_SERVER);

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
const config: PlaywrightTestConfig = {
	// exit CI with error if any tests are marked as `.only`
	forbidOnly: IS_CI,
	retries: IS_CI ? 2 : 0,

	// the timeout for each test
	timeout: 60000,
	expect: {
		// We have a few actions that can take a while to complete. Rather than set
		// a timeout each time just bump the timeout for expect.
		timeout: 20000,
	},
	testMatch: "**/*.e2e.ts",
	// Don't run in parallel
	fullyParallel: false,
	workers: 1,
	use: {
		trace: "retain-on-failure",
		baseURL: `http://localhost:${TEST_SERVER_PORT}`,
	},
	projects: [
		{
			name: "global setup",
			testMatch: "playwright.setup.ts",
			teardown: "global teardown",
		},
		{
			name: "Chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["global setup"],
		},
		{
			name: "global teardown",
			testMatch: "playwright.teardown.ts",
		},
	],
	// Run server before starting the tests
	...(NO_SERVER
		? {}
		: {
				webServer: {
					reuseExistingServer: true,
					command: IS_CI ? `./binaries/${binaryName}` : "bun run dev",
					port: TEST_SERVER_PORT,
					env: { PORT: TEST_SERVER_PORT.toString(), NODE_ENV: "test" },
					stdout: IS_CI ? "ignore" : "pipe",
					stderr: "pipe",
				},
			}),
};

export default config;
