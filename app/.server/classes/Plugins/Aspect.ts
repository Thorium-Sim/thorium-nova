import { thoriumContext } from "@thorium/utils/.server/context";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";

import type BasePlugin from "./index";

type AspectKinds = keyof BasePlugin["aspects"];

type AspectAsset = {
	[assetName: string]: string | string[];
};

export abstract class Aspect extends DataStore {
	abstract apiVersion: string;
	abstract kind: AspectKinds;
	abstract name: string;
	abstract assets?: AspectAsset;
	plugin: BasePlugin;
	constructor(
		params: { name: string },
		aspectConfig: { kind: AspectKinds; subPath?: `/${string}` },
		plugin: BasePlugin,
		options: DataStoreOptions,
	) {
		const { kind, subPath = "/" } = aspectConfig;
		const name = generateIncrementedName(
			params.name || `New ${kind}`,
			plugin.aspects[kind].map((aspect) => aspect.name),
		);
		super(params, {
			meta: {
				filePath: `/plugins/${plugin.id}/${kind}${subPath}${name}/manifest.yml`,
			},
			...options,
		});
		this.plugin = plugin;
		this.getData().then((data) => Object.assign(this, data));
	}

	get pluginName() {
		return this.plugin.name;
	}
	async duplicate(name: string) {
		const data = { ...this };
		data.name = generateIncrementedName(
			name,
			this.plugin.aspects[this.kind].map((aspect) => aspect.name),
		);
		// TODO November 26, 2021: Properly duplicate all of the files associated with this aspect
		// in the file system
		const duplicateConstructor = this.constructor as any;
		return new duplicateConstructor(data);
	}
	/**
	 * Used for serializing the data before it is stored in the file system.
	 */
	toJSON() {
		const { plugin: _, ...data } = this;
		return data;
	}
	async rename(name: string) {
		const otherNames = this.plugin.aspects[this.kind].map((item) => item.name);
		await thoriumContext.getStore()!.rename.call(this, name, otherNames);
	}
}
