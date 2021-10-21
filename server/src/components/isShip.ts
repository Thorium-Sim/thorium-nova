import {Component} from "./utils";

export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  /**
   * The class of the ship. This only applies to spawned ships.
   */
  shipClass: string = "Astra Battleship";
  /**
   * The registry number of the ship. For ship templates, it is a prefix; for spawned ships, it is the fully generated number, based on a hash of the ship's name.
   */
  registry: string = "NCC-1993";

  /**
   * The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.
   */
  category: string = "Cruiser";
}
