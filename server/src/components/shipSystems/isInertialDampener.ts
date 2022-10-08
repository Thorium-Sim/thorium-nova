import {Component} from "../utils";

export class IsInertialDampenersComponent extends Component {
  static id = "isInertialDampeners" as const;

  /** The dampening factor, which affects the speed of the ship based on its current velocity */
  dampening: number = 1;
}
