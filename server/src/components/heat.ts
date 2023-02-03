import {Kelvin, KelvinPerSecond} from "../utils/unitTypes";
import {Component} from "./utils";

export class HeatComponent extends Component {
  static id = "heat" as const;

  /** The current heat value in Kelvin. Defaults to room temperature. */
  heat: Kelvin = 295.37;

  /**
   * The percentage of power that passes through the system which is turned
   * into heat.
   */
  powerToHeat: number = 0.01;

  /**
   * The effectiveness of transferring heat into space. A multiplier
   * for the equation P = A * a * T5
   */
  heatDissipationRate: number = 1;

  /**
   * The standard heat level. When plotted, this
   * represents the very bottom of the heat bar.
   */
  nominalHeat: Kelvin = 295.37;

  /**
   * The temperature at which this system starts experiencing
   * efficiency decreases due to overheating.
   */
  maxSafeHeat: Kelvin = 1000;

  /**
   * The maximum possible temperature. Represents the very top
   * of the heat bar graph.
   */
  maxHeat: Kelvin = 2500;
}
