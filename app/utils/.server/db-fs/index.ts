/* istanbul ignore file */

import { thoriumContext } from "@thorium/utils/.server/context";
import throttle from "lodash.throttle";

const isProxy = Symbol("isProxy");

export interface DataStoreOptions {
	throttle?: number;
	safeMode?: boolean;
	meta?: any;
}

export abstract class DataStore {
	#throttle: number;
	#safeMode: boolean;
	#writeThrottle: (force?: boolean) => Promise<void>;
	initialData: unknown;
	private dataLoaded = false;
	/** Useful for implementations to store arbitrary data */
	#meta: any;
	get meta(): any {
		return this.#meta;
	}
	set meta(value) {
		this.#meta = value;
	}
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

	constructor(initialData: unknown, options: DataStoreOptions) {
		this.initialData = initialData;
		this.meta = options.meta;
		this.#throttle = options.throttle || process.env.NODE_ENV === "production" ? 1000 * 30 : 0;
		this.#safeMode = options.safeMode || false;
		this.#writeThrottle =
			process.env.NODE_ENV === "test"
				? this.write
				: throttle(this.write, this.#throttle, {
						trailing: true,
					});

		const proxy = new Proxy(this, this.#handler);

		return proxy;
	}
	get safeMode() {
		return this.#safeMode;
	}
	toJSON(): any {
		return this;
	}
	async getData<T>(): Promise<T> {
		const loadedData = (await thoriumContext.getStore()!.getData.apply(this)) as Promise<T>;
		this.dataLoaded = true;
		return loadedData;
	}
	async write(force?: boolean, name?: string): Promise<void> {
		// Don't write if we haven't already loaded the data.
		if (!this.dataLoaded) return;
		return thoriumContext.getStore()!.write.call(this, force, name);
	}
	async remove(force?: boolean): Promise<void> {
		return thoriumContext.getStore()!.remove.call(this, force);
	}
	async getAssetUrl() {
		return thoriumContext.getStore()!.thoriumPath;
	}
}
