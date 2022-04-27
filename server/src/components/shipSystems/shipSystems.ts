import {Component} from "../utils";

export class ShipSystemsComponent extends Component {
  static id: "shipSystems" = "shipSystems";

  /** The IDs of the ship system entities assigned to this ship. */
  shipSystemIds: number[] = [];
}
