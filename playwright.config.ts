import { type PlaywrightTestConfig, devices } from "@playwright/test";

function envToBool(value: string | undefined) {
	if (!value) {
		return false;
	}

	return ["true", "1"].includes(value);
}

const IS_CI = envToBool(process.env.CI);

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
	fullyParallel: IS_CI,
	workers: IS_CI ? 4 : 1,
	use: {
		headless: true,
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "Chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
};

export default config;
