/* istanbul ignore file */
import fsCallback from "node:fs";
import path from "node:path";
import throttle from "lodash.throttle";
import { load, dump } from "js-yaml";

const fs =
	process.env.NODE_ENV === "test"
		? {
				mkdir: () => {},
				writeFile: () => {},
				rename: () => {},
				unlink: () => {},
		  }
		: fsCallback.promises;
const readFileSync =
	process.env.NODE_ENV === "test" ? () => "" : fsCallback.readFileSync;
const isProxy = Symbol("isProxy");

let basePath = "./";
export function setBasePath(path: string) {
	basePath = path;
}

export interface FSDataStoreOptions {
	path?: string;
	throttle?: number;
	safeMode?: boolean;
}
export abstract class FSDataStore {
	#path: string;
	#throttle: number;
	#safeMode: boolean;
	#writeThrottle: () => void;
	initialData: unknown;
	#handler: ProxyHandler<any> = {
		get: (target, key) => {
			if (key === "getData") return target[key];
			if (key === isProxy) return true;
			if (key === "mapKey") return target[key];
			if (
				!target[isProxy] &&
				Object.getOwnPropertyDescriptor(target, key) &&
				typeof target[key] === "object" &&
				target[key] !== null &&
				!(target[key] instanceof Date) &&
				!(target[key] instanceof Map) &&
				!(target[key] instanceof Set)
			) {
				return new Proxy(target[key], this.#handler);
			}
			return target[key];
		},
		set: (target, key, value) => {
			target[key] = value;

			this.#writeThrottle();
			return true;
		},
		deleteProperty: (target, key) => {
			if (key in target) {
				delete target[key];
				this.#writeThrottle();
				return true;
			}
			// Ignore it
			return true;
		},
	};
	constructor(initialData: unknown, options: FSDataStoreOptions = {}) {
		this.initialData = initialData;
		this.#path = options.path || "db.json";
		this.#throttle =
			options.throttle || process.env.NODE_ENV === "production" ? 1000 * 30 : 0;
		this.#safeMode = options.safeMode || false;
		this.#writeThrottle =
			process.env.NODE_ENV === "test"
				? this.writeFile
				: throttle(this.writeFile, this.#throttle, {
						trailing: true,
				  });

		const proxy = new Proxy(this, this.#handler);
		// biome-ignore lint/correctness/noConstructorReturn: We need to have the class become a proxy
		return proxy;
	}
	getData() {
		let data: any;
		try {
			data = this.filePath
				? load(readFileSync(this.filePath, "utf8"))
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
	}
	get filePath() {
		return path.join(basePath, this.#path);
	}
	get safeMode() {
		return this.#safeMode;
	}
	toJSON(): any {
		return this;
	}
	get path() {
		return this.#path;
	}
	set path(newPath: string) {
		this.#path = newPath;
	}
	async writeFile(force = false) {
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
			if (!this.filePath) {
				return;
			}
			await fs.mkdir(path.dirname(this.filePath), { recursive: true });
			const serialized = this.toJSON();
			serialized.initialData = undefined;
			const data = dump(serialized, { skipInvalid: true });
			await fs.writeFile(this.filePath, data, { mode: 0o0600 });
		} catch (e: any) {
			e.message = `db-fs: Error writing file:\n${e.message}`;
			throw e;
		}
	}
	async moveFile(newPath: string) {
		if (!this.filePath) return;
		try {
			await fs.rename(this.filePath, newPath);
		} catch (err: any) {
			console.error("Error moving file: ", this.filePath, err);
		}
	}
	async removeFile() {
		if (!this.filePath) return;
		try {
			await fs.unlink(this.filePath);
		} catch (err: any) {
			if (err?.code === "ENOENT") {
				return;
			}
			console.error("Error removing file: ", this.filePath, err);
		}
	}
}
