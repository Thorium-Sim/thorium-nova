import {CubicMeter} from "server/src/utils/unitTypes";
import {Component} from "../utils";

export class CargoContainer extends Component {
  static id = "cargoContainer" as const;

  /** How much cargo this entity can hold */
  volume: CubicMeter = 1;

  /** The contents of this cargo container. The key is the name/ID of inventory template object stored on the flight. */
  contents: {[inventoryTemplateName: string]: number} = {};
}
