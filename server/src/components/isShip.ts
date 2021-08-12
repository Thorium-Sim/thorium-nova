import {Component, ComponentOmit} from "./utils";

export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  static defaults: ComponentOmit<IsShipComponent> = {
    mass: 2000,
    category: "Cruiser",
    shipClass: "Astra Battleship",
    registry: "NCC-",
    nameGeneratorPhrase: null,
  };
  private _category!: string;
  /**
   * Mass in kilograms. Affects acceleration
   */
  mass!: number;
  /**
   * The class of the ship. This only applies to spawned ships.
   */
  shipClass!: string;
  /**
   * The registry number of the ship. For ship templates, it is a prefix; for spawned ships, it is the fully generated number, based on a hash of the ship's name.
   */
  registry!: string;

  /**
   * The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.
   */
  get category(): string {
    return this._category || "Cruiser";
  }
  set category(cat) {
    this._category = cat;
  }
  nameGeneratorPhrase!: string | null;
}
