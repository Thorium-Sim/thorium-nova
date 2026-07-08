import { AsyncLocalStorage } from "node:async_hooks";

import type BasePlugin from "@thorium/.server/classes/Plugins";
import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import type { DataStore } from "@thorium/utils/.server/db-fs";

export interface ThoriumContext {
	database: DatabaseContext;
	thoriumPath: string;
	getData(this: DataStore): Promise<unknown>;
	write(
		this: Pick<DataStore, "safeMode" | "meta" | "initialData" | "toJSON">,
		force?: boolean,
		name?: string,
	): Promise<void>;
	remove(this: DataStore, force?: boolean): Promise<void>;
	readAsset(asset: string): Promise<string>;
	uploadAsset(this: DataStore, asset: File | Blob, fileName?: string): Promise<string>;
	removeAsset(assetPath: string): Promise<void>;
	loadAllAspects(
		this: BasePlugin,
		aspectClasses: Record<
			string,
			new (
				manifest: {
					name: string;
				} & Record<string, any>,
				plugin: BasePlugin,
			) => unknown
		>,
	): Promise<void>;
	rename: (this: DataStore, newName: string, otherNames: string[]) => Promise<void>;
	getFlights: () => Promise<string[]>;
	getFlightSnapshots: (flightName: string) => Promise<string[]>;
}

export const thoriumContext = new AsyncLocalStorage<ThoriumContext>();
