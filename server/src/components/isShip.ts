import {Component} from "./utils";

export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  /**
   * The class of the ship. This only applies to spawned ships.
   */
  shipClass: string = "Astra Battleship";
  /**
   * The registry number of the ship. For spawned ships, it is the fully generated number, based on a hash of the ship's name.
   */
  registry: string = "NCC-1993";

  /**
   * The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.
   */
  category: string = "Cruiser";

  assets: Partial<{
    /**
     * The path to the logo image. Best if it's a square image. SVGs are preferred.
     */
    logo: string;
    /**
     * The path to the 3D model. Must be in GLB or GLTF format. See the docs for instructions on how to position your model.
     */
    model: string;
    /**
     * The vanity (pretty) view of the ship as a PNG. Usually auto-generated from the model.
     */
    vanity: string;
    /**
     * The top view of the ship as a PNG. Usually auto-generated from the model.
     */
    topView: string;
    /**
     * The side view of the ship as a PNG. Usually auto-generated from the model.
     */
    sideView: string;
  }> = {};
}
