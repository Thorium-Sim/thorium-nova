import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],

	test: {
		environment: "happy-dom",
		globals: true,
		alias: {
			"../../../build/defaultPlugin.plug": "./stub.js",
		},
		exclude: [".hutch/**", "node_modules"],
		server: {
			deps: {
				external: ["@thorium-sim/rapier3d-node"],
			},
		},
	},
});
