import {Component, ComponentOmit} from "./utils";

export class RotationComponent extends Component {
  static id: "rotation" = "rotation";
  static defaults: ComponentOmit<RotationComponent> = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };

  x!: number;
  y!: number;
  z!: number;
  w!: number;
}
