import {ShipSystemTypes} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {Component} from "../utils";

export class IsShipSystem extends Component {
  static id: "isShipSystem" = "isShipSystem";

  /** The type of ship system, eg impulseEngines, shields, etc. */
  type: keyof typeof ShipSystemTypes = "generic";

  // Assets should be included in the individual ship systems components
}
