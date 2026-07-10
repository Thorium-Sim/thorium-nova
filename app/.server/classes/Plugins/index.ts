import ConversationPlugin from "@thorium/.server/classes/Plugins/Conversation";
import ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import TextPatternPlugin from "@thorium/.server/classes/Plugins/TextPattern";
import TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import { pubsub } from "@thorium/.server/init/pubsub";
import { thoriumContext } from "@thorium/utils/.server/context";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";

import { generateIncrementedName } from "../../../utils/generateIncrementedName";
import type { ServerDataModel } from "../ServerDataModel";
import InventoryPlugin from "./Inventory";
import { MacroPlugin } from "./Macro";
import MissionPlugin from "./Mission";
import ShipPlugin from "./Ship";
import BaseShipSystemPlugin from "./ShipSystems/BaseSystem";
import StationComplementPlugin from "./StationComplement";
import ThemePlugin from "./Theme";
import SolarSystemPlugin from "./Universe/SolarSystem";

export function pluginPublish(plugin: BasePlugin) {
	pubsub.publish.plugin.all();
	pubsub.publish.plugin.get({
		pluginId: plugin.id,
	});
}

const Aspects = {
	ships: ShipPlugin,
	shipSystems: BaseShipSystemPlugin,
	stationComplements: StationComplementPlugin,
	themes: ThemePlugin,
	solarSystems: SolarSystemPlugin,
	inventory: InventoryPlugin,
	missions: MissionPlugin,
	macros: MacroPlugin,
	reports: ReportPlugin,
	trainings: TrainingPlugin,
	conversations: ConversationPlugin,
	textPatterns: TextPatternPlugin,
};

export type AspectsMap = {
	[k in keyof typeof Aspects]: InstanceType<(typeof Aspects)[k]>[];
};

// Storing the server here so it doesn't get
// serialized with the plugin.
let storedServer: ServerDataModel;
// Same with plugin aspects. By storing them in a WeakMap,
// they'll be keyed to the plugin, but will automatically
// be garbage collected if the plugin is ever deleted.
const pluginAspects = new WeakMap<BasePlugin, AspectsMap>();
export default class BasePlugin extends DataStore {
	id!: string;
	name!: string;
	kind = "plugins" as const;
	author!: string;
	description!: string;
	default!: boolean;
	active!: boolean;
	coverImage!: string;
	#loadAllAspects: (
		this: BasePlugin,
		aspectClasses: Record<
			string,
			new (manifest: { name: string } & Record<string, any>, plugin: BasePlugin) => unknown
		>,
	) => Promise<void>;
	#getDataPromise: Promise<void>;
	tags!: string[];
	constructor(params: Partial<BasePlugin>, server: ServerDataModel, options: DataStoreOptions) {
		const name = generateIncrementedName(
			params.name || "New Plugin",
			server.plugins.map((p) => p.name),
		);
		super(params, {
			meta: {
				filePath: `/plugins/${name}/manifest.yml`,
			},
			...options,
		});
		this.#loadAllAspects = thoriumContext.getStore()!.loadAllAspects;
		this.#getDataPromise = this.getData<BasePlugin>().then((data) => {
			this.id = data.id || params.id || name;
			this.name = name;
			this.author = data.author || "";
			this.description = data.description || "A great plugin";
			this.coverImage = data.coverImage || "";
			this.tags = data.tags || [];
			this.active = data.active ?? true;
			this.default = data.default ?? false;
			storedServer = server;
		});
	}
	get server() {
		return storedServer;
	}
	get aspects(): AspectsMap {
		let aspects = pluginAspects.get(this);
		if (!aspects) {
			aspects = {
				ships: [],
				shipSystems: [],
				stationComplements: [],
				themes: [],
				solarSystems: [],
				inventory: [],
				missions: [],
				macros: [],
				reports: [],
				trainings: [],
				conversations: [],
				textPatterns: [],
			};
			pluginAspects.set(this, aspects);
		}
		return aspects;
	}
	async loadAspects() {
		await this.#getDataPromise;
		await this.#loadAllAspects({ ...Aspects, ...ShipSystemTypes });
	}
	async rename(name: string) {
		const otherNames = this.server.plugins.map((p) => p.name);
		await thoriumContext.getStore()!.rename.call(this, name, otherNames);
	}
	async write(force = false) {
		await super.write(force);
		if (force) {
			for (const aspect in this.aspects) {
				for (const aspectInstance of this.aspects[aspect as keyof AspectsMap]) {
					await aspectInstance.write(force);
				}
			}
		}
	}
	toJSON() {
		const { id, name, kind, author, description, default: d, active, coverImage, tags } = this;
		return { id, name, kind, author, description, default: d, active, coverImage, tags };
	}
	duplicate(name: string) {
		const data = { ...this };
		data.name = generateIncrementedName(
			name,
			this.server.plugins.map((p) => p.name),
		);
		data.id = data.name;
		// TODO October 23: Properly duplicate all of the files associated with this plugin
		// in the file system
		return new BasePlugin(data, this.server, {
			meta: this.meta,
		});
	}
}
