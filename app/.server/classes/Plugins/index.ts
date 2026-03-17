import type { ServerDataModel } from "../ServerDataModel";
import { generateIncrementedName } from "../../../utils/generateIncrementedName";
import ShipPlugin from "./Ship";
import {
	DataStore,
	type DataStoreOptions,
	type LoadAspectFn,
} from "@thorium/utils/.server/db-fs";
import StationComplementPlugin from "./StationComplement";
import ThemePlugin from "./Theme";
import SolarSystemPlugin from "./Universe/SolarSystem";
import BaseShipSystemPlugin from "./ShipSystems/BaseSystem";
import InventoryPlugin from "./Inventory";
import { pubsub } from "@thorium/.server/init/pubsub";
import { MacroPlugin } from "./Macro";
import ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import MissionPlugin from "./Mission";
import TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import BridgePlugin from "./Bridge";

export function pluginPublish(plugin: BasePlugin) {
	pubsub.publish.plugin.all();
	pubsub.publish.plugin.get({
		pluginId: plugin.id,
	});
}

interface Aspects {
	ships: ShipPlugin[];
	shipSystems: BaseShipSystemPlugin[];
	stationComplements: StationComplementPlugin[];
	themes: ThemePlugin[];
	solarSystems: SolarSystemPlugin[];
	inventory: InventoryPlugin[];
	missions: MissionPlugin[];
	macros: MacroPlugin[];
	reports: ReportPlugin[];
	trainings: TrainingPlugin[];
	bridges: BridgePlugin[];
}
// Storing the server here so it doesn't get
// serialized with the plugin.
let storedServer: ServerDataModel;
// Same with plugin aspects. By storing them in a WeakMap,
// they'll be keyed to the plugin, but will automatically
// be garbage collected if the plugin is ever deleted.
const pluginAspects = new WeakMap<BasePlugin, Aspects>();
export default class BasePlugin extends DataStore {
	id!: string;
	name!: string;
	author!: string;
	description!: string;
	default!: boolean;
	active!: boolean;
	coverImage!: string;
	#loadAspect: LoadAspectFn;
	#getDataPromise: Promise<void>;
	tags!: string[];
	constructor(
		params: Partial<BasePlugin>,
		server: ServerDataModel,
		options: DataStoreOptions,
	) {
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
		this.#loadAspect = DataStore.operations.getStore()!.loadAspect;
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
	get aspects(): Aspects {
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
				bridges: [],
			};
			pluginAspects.set(this, aspects);
		}
		return aspects;
	}
	async loadAspects() {
		await this.#getDataPromise;
		this.aspects.ships = await this.#loadAspect("ships", ShipPlugin);

		this.aspects.shipSystems = await this.#loadAspect(
			"shipSystems",
			BaseShipSystemPlugin,
		);
		this.aspects.stationComplements = await this.#loadAspect(
			"stationComplements",
			StationComplementPlugin,
		);

		this.aspects.themes = await this.#loadAspect("themes", ThemePlugin);
		this.aspects.solarSystems = await this.#loadAspect(
			"solarSystems",
			SolarSystemPlugin,
		);
		this.aspects.inventory = await this.#loadAspect(
			"inventory",
			InventoryPlugin,
		);
		this.aspects.missions = await this.#loadAspect("missions", MissionPlugin);
		this.aspects.macros = await this.#loadAspect("macros", MacroPlugin);
		this.aspects.reports = await this.#loadAspect("reports", ReportPlugin);
		this.aspects.trainings = await this.#loadAspect(
			"trainings",
			TrainingPlugin,
		);
		this.aspects.bridges = await this.#loadAspect("bridges", BridgePlugin);
	}
	async rename(name: string) {
		const otherNames = this.server.plugins.map((p) => p.name);
		await DataStore.operations.getStore()!.rename.call(this, name, otherNames);
	}
	async write(force = false) {
		await super.write(force);
		if (force) {
			for (const aspect in this.aspects) {
				for (const aspectInstance of this.aspects[aspect as keyof Aspects]) {
					await aspectInstance.write(force);
				}
			}
		}
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
