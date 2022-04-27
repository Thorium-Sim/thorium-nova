import {Kelvin} from "../utils/unitTypes";
import {Component} from "./utils";

export class HeatComponent extends Component {
  static id = "heat" as const;

  /** The current heat value in Kelvin. Defaults to room temperature. */
  heat: Kelvin = 295.37;
}
