import fs from "node:fs/promises";
import path from "node:path";

import BasePlugin, { type AspectsMap } from "@thorium/.server/classes/Plugins";
import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import { getThoriumPath } from "@thorium/utils/.server/appPaths";
import type { ThoriumContext } from "@thorium/utils/.server/context";
import { loadYml } from "@thorium/utils/.server/db-fs/loadYml";
import { moveFile } from "@thorium/utils/.server/moveFile";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { dump } from "js-yaml";

let basePath = "./";
export function setBasePath(path: string) {
	basePath = path;
}

export function bunDataStoreProps(env: string): ThoriumContext {
	const thoriumPath = getThoriumPath(env);
	return {
		database: {} as DatabaseContext,
		thoriumPath,
		async getData() {
			const filePath = path.join(basePath, this.meta.filePath);
			let data: any;
			try {
				const fileData = await fs.readFile(filePath, "utf8");
				data = loadYml(fileData);
			} catch (err: any) {
				if (err.code === "EACCES") {
					err.message += "\ndata-store does not have permission to load this file\n";
					throw err;
				}
			}
			if (!data) {
				data = Object.fromEntries(Object.entries(this.initialData as any));
			}
			return data;
		},
		async write(force = false, name?: string) {
			let filePath = path.join(basePath, this.meta.filePath);
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
				// Named snapshots are only for flights.
				if (name && this.meta.flightName) {
					filePath = path.join(basePath, "flights", this.meta.flightName, `${name}.yml`);
				}
				await fs.mkdir(path.dirname(filePath), { recursive: true });
				this.initialData = undefined;
				const jsonData = this.toJSON();
				jsonData.dataLoaded = undefined;
				const data = dump(jsonData, {
					skipInvalid: true,
				});
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
		async readAsset(assetUrl) {
			return Bun.file(assetUrl).text();
		},
		async uploadAsset(file, fileName) {
			await fs.mkdir(
				path.join(thoriumPath, path.join(path.dirname(this.meta.filePath), "assets")),
				{
					recursive: true,
				},
			);
			return moveFile(
				file,
				// @ts-expect-error Bun adds the file name
				fileName || file.name,
				path.join(path.dirname(this.meta.filePath), "assets"),
			);
		},
		async removeAsset(filePath) {
			await fs.unlink(path.join(thoriumPath, filePath));
		},
		async loadAllAspects(
			this: BasePlugin,
			aspectClasses: Record<
				string,
				new (manifest: { name: string } & Record<string, any>, plugin: BasePlugin) => unknown
			>,
		) {
			const glob = new Bun.Glob(
				path.join(thoriumPath, "plugins", this.id, "*", "**", "manifest.yml"),
			);
			await Promise.all(
				(await Array.fromAsync(glob.scan({ onlyFiles: true }))).map(async (filePath) => {
					try {
						const fileData = await Bun.file(filePath).text();
						const aspectData = loadYml(fileData);
						const kind = aspectData.kind as keyof AspectsMap;
						const className = aspectData.kind === "shipSystems" ? aspectData.type : aspectData.kind;
						// Ignore the plugins themselves
						if (className === "plugins") return;
						const aspectClass = aspectClasses[className];
						if (!aspectClass) {
							throw new Error(`Invalid aspect class: ${className}`);
						}
						if (!this.aspects[kind]) throw new Error(`Invalid aspect kind: ${kind}`);
						// @ts-expect-error
						this.aspects[kind].push(new aspectClass(aspectData, this));
					} catch (error) {
						console.error(error);
					}
				}),
			);
		},
		async rename(name, otherNames) {
			if (!("name" in this) || typeof this.name !== "string") return;
			if (name.trim() === this.name) return;
			const newName = generateIncrementedName(name.trim() || this.name, otherNames);
			const currentPath = path.dirname(this.meta.filePath);
			const newPath = path.join(path.dirname(currentPath), newName);
			await fs.rename(path.join(thoriumPath, currentPath), path.join(thoriumPath, newPath));
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
				files = await fs.readdir(path.join(thoriumPath, "/flights/"));
			} catch {
				await fs.mkdir(path.join(thoriumPath, "/flights/"));
				files = [];
			}
			return files.filter((f) => !f.startsWith("."));
		},
		async getFlightSnapshots(name: string) {
			let files: string[];
			try {
				files = await fs.readdir(path.join(thoriumPath, "/flights/", name));
			} catch {
				files = [];
			}
			return files
				.filter((f) => !f.startsWith(".") && f !== "data.yml" && f !== "assets")
				.map((f) => f.replace(".yml", ""));
		},
	};
}
