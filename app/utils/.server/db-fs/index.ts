/* istanbul ignore file */

import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import type ThemePlugin from "@thorium/.server/classes/Plugins/Theme";
import throttle from "lodash.throttle";
import { AsyncLocalStorage } from "node:async_hooks";

const isProxy = Symbol("isProxy");

export interface DataStoreOptions {
	throttle?: number;
	safeMode?: boolean;
	meta?: any;
}

export type LoadAspectFn = <T>(
	this: BasePlugin,
	aspectName: string,
	aspect: {
		new (
			manifest: {
				name: string;
			} & Record<string, any>,
			plugin: BasePlugin,
		): T;
	},
) => Promise<T[]>;
export interface DataStoreOperations {
	getData(this: DataStore): Promise<unknown>;
	write(this: DataStore, force?: boolean): Promise<void>;
	remove(this: DataStore, force?: boolean): Promise<void>;
	getAssetUrl(this: DataStore): Promise<string>;
	readAsset(this: DataStore, asset: string): Promise<string>;
	uploadAsset(
		this: DataStore,
		asset: File | Blob,
		fileName?: string,
	): Promise<string>;
	removeAsset(assetPath: string): Promise<void>;
	loadAspect: LoadAspectFn;
	processCSS: (
		this: ThemePlugin,
		css: string,
	) => Promise<{ processedCSS: string; assetUrl: string }>;
	rename: (
		this: DataStore,
		newName: string,
		otherNames: string[],
	) => Promise<void>;
	getFlights: () => Promise<FlightDataModel[]>;
}
export abstract class DataStore {
	static operations = new AsyncLocalStorage<DataStoreOperations>();
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
		this.#throttle =
			options.throttle || process.env.NODE_ENV === "production" ? 1000 * 30 : 0;
		this.#safeMode = options.safeMode || false;
		this.#writeThrottle =
			process.env.NODE_ENV === "test"
				? this.write
				: throttle(this.write, this.#throttle, {
						trailing: true,
					});

		const proxy = new Proxy(this, this.#handler);
		// biome-ignore lint/correctness/noConstructorReturn: We need to have the class become a proxy
		return proxy;
	}
	get safeMode() {
		return this.#safeMode;
	}
	toJSON(): any {
		return this;
	}
	async getData<T>(): Promise<T> {
		const loadedData = (await DataStore.operations
			.getStore()!
			.getData.apply(this)) as Promise<T>;
		this.dataLoaded = true;
		return loadedData;
	}
	async write(force?: boolean): Promise<void> {
		// Don't write if we haven't already loaded the data.
		if (!this.dataLoaded) return;
		return DataStore.operations.getStore()!.write.call(this, force);
	}
	async remove(force?: boolean): Promise<void> {
		return DataStore.operations.getStore()!.remove.call(this, force);
	}
	async getAssetUrl() {
		return DataStore.operations.getStore()!.getAssetUrl.call(this);
	}
}
