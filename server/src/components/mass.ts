import {Component} from "./utils";

export class MassComponent extends Component {
  static id: "mass" = "mass";

  /**
   * The mass of the object in kilograms
   */
  mass: number = 700_000_000;
}
