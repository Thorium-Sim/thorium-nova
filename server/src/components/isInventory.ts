import {InventoryFlags} from "../classes/Plugins/Inventory";
import {Component} from "./utils";

export class IsInventoryComponent extends Component {
  static id = "isInventory" as const;
  /** How much space is required to store 1 unit of this inventory */
  volume: number = 1;
  /** Whether the inventory is a discrete item, like a probe casing, vs being represented with a decimal, like fuel */
  continuous: boolean = false;
  /** The continuous value of the item, between 0-1. Always 1 if continuous = false */
  remaining: number = 1;

  flags: InventoryFlags = {};
  assets: {image?: string} = {};

  /**
   * The ID of the entity that contains this inventory.
   * Could be a room, shipping container, or person.
   * Entities take on the position of their container.
   */
  containerId: number | null = null;
}
