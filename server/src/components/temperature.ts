import {Component} from "./utils";
import {Kelvin} from "../utils/unitTypes";

export class TemperatureComponent extends Component {
  static id = "temperature" as const;
  /**
   * Temperature in Kelvin (K)
   */
  temperature: Kelvin = 5800;
}
