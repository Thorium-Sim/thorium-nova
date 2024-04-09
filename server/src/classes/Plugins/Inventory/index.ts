import { generateIncrementedName } from "server/src/utils/generateIncrementedName";
import type { Liter } from "server/src/utils/unitTypes";
import type BasePlugin from "..";
import { Aspect } from "../Aspect";
import type { InventoryFlags } from "./InventoryFlags";

export default class InventoryPlugin extends Aspect {
	apiVersion = "inventory/v1" as const;
	kind = "inventory" as const;
	name!: string;
	plural!: string;
	description!: string;
	/** How much space is required to store 1 unit of this inventory */
	volume!: Liter;
	assets!: { image?: string };
	/** Whether the inventory is a discrete item, like a probe casing, vs being represented with a decimal, like fuel */
	continuous!: boolean;
	/** Probability the item will not be consumed when used. 1 means it lasts forever; 0 means it will always be consumed when used. */
	durability!: number;
	/** The number of this item that a mid-sized ship (think an Intrepid-class from Star Trek - 15 decks, 500 m^3 of total cargo space) would carry. Use 0 if you don't want this inventory automatically being added to new ships. */
	abundance = 1;
	tags!: string[];
	// TODO June 13, 2022 - We need to figure out some heuristics for automatically generating the inventory list on ships
	flags!: InventoryFlags;
	constructor(params: Partial<InventoryPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Inventory",
			plugin.aspects.inventory.map((inventory) => inventory.name),
		);
		super({ ...params, name }, { kind: "inventory" }, plugin);
		this.name = this.name || name;
		this.plural = this.plural || params.plural || name;
		this.description = this.description || params.description || "";
		this.volume = this.volume ?? params.volume ?? 1000;
		this.assets = this.assets || params.assets || {};
		this.continuous = this.continuous ?? params.continuous ?? false;
		this.durability = this.durability ?? params.durability ?? 1;
		this.abundance = this.abundance ?? params.abundance ?? 0;
		this.flags = this.flags || params.flags || {};
		this.tags = this.tags || params.tags || [];
	}
}
