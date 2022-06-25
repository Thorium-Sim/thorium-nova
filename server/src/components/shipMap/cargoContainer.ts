import {CubicMeter} from "server/src/utils/unitTypes";
import {Component} from "../utils";

export class CargoContainer extends Component {
  static id = "cargoContainer" as const;

  /** How much cargo this entity can hold */
  volume: CubicMeter = 1;
}
