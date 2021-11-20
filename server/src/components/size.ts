import {Component} from "./utils";

/**
 * Used for measuring the size of ships and ship-like entities
 *
 * Typically these measurements should be calculated from the length
 * of the object and the dimensions of the 3D models that represents the object
 */
export class SizeComponent extends Component {
  static id: "size" = "size";

  /**
   * Length in meters
   */
  length: number = 350;
  /**
   * Width in meters
   */
  width: number = 135;
  /**
   * Height in meters
   */
  height: number = 67;
}
