import {Liter} from "@server/utils/unitTypes";
import {InventoryFlags} from "../classes/Plugins/Inventory/InventoryFlags";
import {Component} from "./utils";

export class IsInventoryComponent extends Component {
  static id = "isInventory" as const;
  plural?: string;
  /** How much space is required to store 1 unit of this inventory */
  volume: Liter = 1;
  /** Whether the inventory is a discrete item, like a probe casing, vs being represented with a decimal, like fuel */
  continuous: boolean = false;
  /** Probability the item will not be consumed when used. 1 means it lasts forever; 0 means it will always be consumed when used. */
  durability: number = 1;
  /** The number of this item that a mid-sized ship (think an Intrepid-class from Star Trek - 15 decks, 500 m^3 of total cargo space) would carry. Use 0 if you don't want this inventory automatically being added to new ships. */
  abundance: number = 1;

  flags: InventoryFlags = {};
  assets: {image?: string} = {};
}
