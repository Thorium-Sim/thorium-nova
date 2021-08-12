import {Component, ComponentOmit} from "./utils";

export class VelocityComponent extends Component {
  static id: "velocity" = "velocity";
  static defaults: ComponentOmit<VelocityComponent> = {
    x: 0,
    y: 0,
    z: 0,
  };

  x!: number;

  y!: number;

  z!: number;
}
