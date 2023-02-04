import {Component} from "../utils";

export class ShipSystemsComponent extends Component {
  static id: "shipSystems" = "shipSystems";
  static serialize({
    shipSystems: shipSystemIds,
    ...data
  }: Omit<ShipSystemsComponent, "init">) {
    return {...data, shipSystemIds: Array.from(shipSystemIds.entries())};
  }
  init(params: any = {}) {
    (Object.getOwnPropertyNames(this) as (keyof this)[]).forEach(key => {
      if (key === "shipSystems") {
        this.shipSystems = new Map(params["shipSystemIds"]);
      }
      if (key !== "init") {
        this[key] = params[key] ?? this[key];
      }
    });
  }
  /**
   * The IDs of the ship system entities assigned to this ship
   * and the rooms they are assigned to
   */
  shipSystems: Map<number, {roomId?: number}> = new Map();
}
