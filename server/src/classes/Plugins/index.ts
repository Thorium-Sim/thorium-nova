import type { ServerDataModel } from "../ServerDataModel";
import { generateIncrementedName } from "../../utils/generateIncrementedName";
import ShipPlugin from "./Ship";
import { thoriumPath } from "server/src/utils/appPaths";
import fs from "node:fs/promises";
import { FSDataStore } from "@thorium/db-fs";
import path from "node:path";
import StationComplementPlugin from "./StationComplement";
import { loadFolderYaml } from "server/src/utils/loadFolderYaml";
import ThemePlugin from "./Theme";
import SolarSystemPlugin from "./Universe/SolarSystem";
import BaseShipSystemPlugin from "./ShipSystems/BaseSystem";
import InventoryPlugin from "./Inventory";
import TimelinePlugin from "./Timeline";
import { pubsub } from "@server/init/pubsub";
import { MacroPlugin } from "./Macro";

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
	timelines: TimelinePlugin[];
	macros: MacroPlugin[];
}
// Storing the server here so it doesn't get
// serialized with the plugin.
let storedServer: ServerDataModel;
// Same with plugin aspects. By storing them in a WeakMap,
// they'll be keyed to the plugin, but will automatically
// be garbage collected if the plugin is ever deleted.
const pluginAspects = new WeakMap<BasePlugin, Aspects>();
export default class BasePlugin extends FSDataStore {
	id: string;
	name: string;
	author: string;
	description: string;
	default: boolean;
	active: boolean;
	_coverImage: string;
	get coverImage() {
		if (!this._coverImage) return "";
		// Allow images from the internet
		if (this._coverImage.startsWith("http")) return this._coverImage;
		// Allow absolute paths
		if (this._coverImage.startsWith("/")) return this._coverImage;
		// Otherwise, resolve and return the relative path
		return `${this.pluginPath}/assets/${this._coverImage}`;
	}
	set coverImage(coverImage: string) {
		this._coverImage = coverImage;
	}
	get pluginPath() {
		return `/plugins/${this.name}`;
	}
	tags: string[];
	constructor(params: Partial<BasePlugin>, server: ServerDataModel) {
		const name = generateIncrementedName(
			params.name || "New Plugin",
			server.plugins.map((p) => p.name),
		);
		super(params, {
			path: `/plugins/${name}/manifest.yml`,
		});
		const data = this.getData();
		this.id = data.id || params.id || name;
		this.name = name;
		this.author = data.author || "";
		this.description = data.description || "A great plugin";
		this._coverImage = data.coverImage || "";
		this.tags = data.tags || [];
		this.active = data.active ?? true;
		this.default = data.default ?? false;
		storedServer = server;

		this.loadAspects();
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
				timelines: [],
				macros: [],
			};
			pluginAspects.set(this, aspects);
		}
		return aspects;
	}
	async loadAspects() {
		this.aspects.ships = await BasePlugin.loadAspect(this, "ships", ShipPlugin);

		this.aspects.shipSystems = await BasePlugin.loadAspect(
			this,
			"shipSystems",
			BaseShipSystemPlugin,
		);
		this.aspects.stationComplements = await BasePlugin.loadAspect(
			this,
			"stationComplements",
			StationComplementPlugin,
		);

		this.aspects.themes = await BasePlugin.loadAspect(
			this,
			"themes",
			ThemePlugin,
		);
		this.aspects.solarSystems = await BasePlugin.loadAspect(
			this,
			"solarSystems",
			SolarSystemPlugin,
		);
		this.aspects.inventory = await BasePlugin.loadAspect(
			this,
			"inventory",
			InventoryPlugin,
		);
		this.aspects.timelines = await BasePlugin.loadAspect(
			this,
			"timelines",
			TimelinePlugin,
		);
		this.aspects.macros = await BasePlugin.loadAspect(
			this,
			"macros",
			MacroPlugin,
		);
	}
	toJSON() {
		const { _coverImage, ...data } = this;
		return { ...data, coverImage: this.coverImage };
	}
	serialize() {
		const { _coverImage, ...data } = this;
		return { ...data, coverImage: _coverImage };
	}
	async rename(name: string) {
		if (name.trim() === this.name) return;
		const newName = generateIncrementedName(
			name.trim() || this.name,
			this.server.plugins.map((p) => p.name),
		);
		await fs.rename(
			`${thoriumPath}/plugins/${this.name}`,
			`${thoriumPath}/plugins/${newName}`,
		);
		this.id = newName;
		this.name = newName;
		this.path = `/plugins/${newName}/manifest.yml`;

		// Also rename the cover image
		const coverImage = path.basename(this.coverImage);
		this.coverImage = `${this.pluginPath}/assets/${coverImage}`;
		await this.writeFile(true);
	}
	async writeFile(force = false) {
		await super.writeFile(force);
		if (force) {
			for (const aspect in this.aspects) {
				for (const aspectInstance of this.aspects[aspect as keyof Aspects]) {
					await aspectInstance.writeFile(force);
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
		return new BasePlugin(data, this.server);
	}
	static async loadAspect<T>(
		plugin: BasePlugin,
		aspectName: string,
		aspect: {
			new (
				manifest: { name: string } & Record<string, any>,
				plugin: BasePlugin,
			): T;
		},
	) {
		const objectGlob = `${thoriumPath}/plugins/${plugin.id}/${aspectName}/*/manifest.yml`;
		const data = await loadFolderYaml<{ name: string } & Record<string, any>>(
			objectGlob,
		);
		return data.map((aspectData) => {
			return new aspect(aspectData, plugin);
		});
	}
}
