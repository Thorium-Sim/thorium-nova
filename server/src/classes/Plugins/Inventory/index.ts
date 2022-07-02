import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import {CubicMeter} from "server/src/utils/unitTypes";
import BasePlugin from "..";
import {Aspect} from "../Aspect";
import {InventoryFlags} from "./InventoryFlags";

export default class InventoryPlugin extends Aspect {
  apiVersion = "inventory/v1" as const;
  kind = "inventory" as const;
  name!: string;
  plural!: string;
  description!: string;
  /** How much space is required to store 1 unit of this inventory */
  volume!: CubicMeter;
  assets!: {image?: string};
  /** Whether the inventory is a discrete item, like a probe casing, vs being represented with a decimal, like fuel */
  continuous!: boolean;
  /** If continuous, the decimal portion left over of this inventory. For discrete items, this is always 1 */
  // This isn't necessary for the plugin, but I'm going to keep it here for now.
  // remaining!: number;
  /** Probability the item will not be consumed when used. 1 means it lasts forever; 0 means it will always be consumed when used. */
  durability!: number;
  tags!: string[];
  // TODO June 13, 2022 - We need to figure out some heuristics for automatically generating the inventory list on ships
  flags!: InventoryFlags;
  constructor(params: Partial<InventoryPlugin>, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || "New Inventory",
      plugin.aspects.inventory.map(inventory => inventory.name)
    );
    super({...params, name}, {kind: "inventory"}, plugin);
    this.plural = this.plural || params.plural || name;
    this.description = this.description || params.description || "";
    this.volume = this.volume ?? params.volume ?? 1;
    this.assets = this.assets || params.assets || {};
    this.continuous = this.continuous ?? params.continuous ?? false;
    this.durability = this.durability ?? params.durability ?? 1;
    this.flags = this.flags || params.flags || {};
    this.tags = this.tags || params.tags || [];
  }
}
