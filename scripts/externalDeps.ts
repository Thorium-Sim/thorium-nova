import { mkdir, rm } from "node:fs/promises";

await rm("./external-deps", { force: true, recursive: true });

await mkdir("./external-deps");

await Bun.file("./external-deps/package.json").write(
	JSON.stringify({
		name: "external-deps",
		patchedDependencies: {
			"@thorium-sim/rapier3d-node@0.13.2": "patches/@thorium-sim%2Frapier3d-node@0.13.2.patch",
		},
	}),
);
await Bun.$`cp -r ./patches ./external-deps/patches`;

await Bun.$`bun i --cwd ./external-deps @msgpack/msgpack pdfkit @thorium-sim/rapier3d-node`;
