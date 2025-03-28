import fs from "node:fs/promises";
import path from "node:path";
import { load, dump } from "js-yaml";
import type {
	DataStoreOperations,
	DataStoreOptions,
} from "@thorium/utils/.server/db-fs";
import BasePlugin from "@thorium/.server/classes/Plugins";
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { loadFolderYaml } from "@thorium/utils/.server/db-fs/loadFolderYaml";
import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { moveFile } from "@thorium/utils/.server/moveFile";
import less from "less";
import tailwindcss from "tailwindcss";
import postcss from "postcss";
// @ts-expect-error - No types
import postcssLess from "postcss-less";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";

let basePath = "./";
export function setBasePath(path: string) {
	basePath = path;
}

const flightMap = new Map<string, FlightDataModel>();

export const bunDataStoreProps: DataStoreOperations = {
	async getData() {
		const filePath = path.join(basePath, this.meta.filePath);
		let data: any;
		try {
			data = filePath
				? load(await fs.readFile(filePath, "utf8"), {
						json: true,
						onWarning: (e) => console.warn("YAML load warning:", e),
					})
				: this.initialData;
		} catch (err: any) {
			if (err.code === "EACCES") {
				err.message +=
					"\ndata-store does not have permission to load this file\n";
				throw err;
			}
		}
		if (!data) {
			data = Object.fromEntries(Object.entries(this.initialData as any));
		}
		return data;
	},
	async write(force = false) {
		const filePath = path.join(basePath, this.meta.filePath);

		try {
			if (this.safeMode && force === false) return;
			if (
				!this.safeMode &&
				process.env.NODE_ENV !== "production" &&
				process.env.NODE_ENV !== "test" &&
				force === false
			)
				return;
			if (process.env.NODE_ENV === "test") return;
			if (!filePath) {
				return;
			}
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			this.initialData = undefined;
			const data = dump(this.toJSON(), { skipInvalid: true });
			await fs.writeFile(filePath, data, { mode: 0o0600 });
		} catch (e: any) {
			e.message = `db-fs: Error writing file:\n${e.message}`;
			throw e;
		}
	},
	async remove() {
		const filePath = path.join(basePath, this.meta.filePath);

		if (!filePath) return;
		try {
			await fs.rm(path.dirname(filePath), {
				recursive: true,
				force: true,
			});
		} catch (err: any) {
			if (err?.code === "ENOENT") {
				return;
			}
			console.error("Error removing file: ", filePath, err);
		}
	},

	async getAssetUrl() {
		return path.join(thoriumPath);
	},
	async readAsset(assetUrl) {
		return fs.readFile(assetUrl, "utf-8") || "";
	},
	async uploadAsset(file, fileName) {
		await fs.mkdir(
			path.join(
				thoriumPath,
				path.join(path.dirname(this.meta.filePath), "assets"),
			),
			{
				recursive: true,
			},
		);
		return moveFile(
			file,
			fileName || file.name,
			path.join(path.dirname(this.meta.filePath), "assets"),
		);
	},
	async removeAsset(filePath) {
		await fs.unlink(path.join(thoriumPath, filePath));
	},
	async loadAspect<T>(
		this: BasePlugin,
		aspectName: string,
		aspect: {
			new (
				manifest: { name: string } & Record<string, any>,
				plugin: BasePlugin,
			): T;
		},
	) {
		const objectGlob = `${thoriumPath}/plugins/${this.id}/${aspectName}/*/manifest.yml`;
		const data = await loadFolderYaml<{ name: string } & Record<string, any>>(
			objectGlob,
		);

		return data.map((aspectData) => {
			if (aspectName === "shipSystems") {
				const systemClass =
					ShipSystemTypes[aspectData.type as keyof typeof ShipSystemTypes];
				return new systemClass(aspectData, this) as InstanceType<typeof aspect>;
			}
			return new aspect(aspectData, this);
		});
	},
	async processCSS(rawCSS) {
		const config = (await import("../../../../tailwind.config")) as any;
		const postCSSAction = postcss([tailwindcss(config.default)]);
		const postcssOutput = (
			await postCSSAction.process(`.theme-container {${rawCSS}}`, {
				syntax: postcssLess,
				from: "tailwind-default",
			})
		).css;
		const processedCSS = (await less.render(postcssOutput)).css;
		await fs.mkdir(
			path.join(thoriumPath, path.dirname(this.meta.filePath), "assets"),
			{ recursive: true },
		);
		await fs.writeFile(path.join(thoriumPath, "raw.css"), rawCSS);
		await fs.writeFile(
			path.join(
				thoriumPath,
				path.dirname(this.meta.filePath),
				"assets",
				"processed.css",
			),
			processedCSS,
		);
		return { processedCSS, assetUrl: "processed.css" };
	},
	async rename(name, otherNames) {
		if (!("name" in this) || typeof this.name !== "string") return;
		if (name.trim() === this.name) return;
		const newName = generateIncrementedName(
			name.trim() || this.name,
			otherNames,
		);
		const currentPath = path.dirname(this.meta.filePath);
		const newPath = path.join(path.dirname(currentPath), newName);
		await fs.rename(
			path.join(thoriumPath, currentPath),
			path.join(thoriumPath, newPath),
		);
		if ("id" in this) {
			this.id = newName;
		}
		this.name = newName;
		this.meta.filePath = path.join(newPath, "manifest.yml");

		await this.write(true);
	},
	async getFlights() {
		let files: string[];
		try {
			files = await fs.readdir(`${thoriumPath}/flights/`);
		} catch {
			await fs.mkdir(`${thoriumPath}/flights/`);
			files = [];
		}
		const flightFiles = files.filter((f) => f.includes(".flight"));
		const flightData = await Promise.all(
			flightFiles.map(async (flightName) => {
				if (flightMap.has(flightName)) return flightMap.get(flightName);
				const raw = await fs.readFile(
					`${thoriumPath}/flights/${flightName}`,
					"utf-8",
				);
				const data = load(raw) as any;
				flightMap.set(flightName, {
					...data,
					date: new Date(data?.date),
				} as FlightDataModel);
				return flightMap.get(flightName);
			}),
		);
		return flightData as FlightDataModel[];
	},
};

export async function loadPlugins(this: ServerDataModel) {
	const plugins = new Bun.Glob(`${thoriumPath}/plugins/*/manifest.yml`).scan({
		onlyFiles: true,
	});
	const pluginRegex = new RegExp(`${thoriumPath}/plugins/(.*)/manifest.yml`);
	for await (const plugin of plugins) {
		const name = pluginRegex.exec(plugin)![1];
		try {
			const plugin = new BasePlugin({ name }, this, {
				meta: { filePath: `/plugins/${name}/manifest.yml` },
			});
			await plugin.loadAspects();
			this.plugins.push(plugin);
		} catch (err) {
			console.error(`Error loading plugin ${name}:`, err);
		}
	}
}
