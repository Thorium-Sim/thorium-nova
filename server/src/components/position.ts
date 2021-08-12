import {Component, ComponentOmit} from "./utils";

export class PositionComponent extends Component {
  // Note: When used with Planetary System components, position represents lightyears; otherwise it represents kilometers
  static id: "position" = "position";
  static defaults: ComponentOmit<PositionComponent> = {
    x: 0,
    y: 0,
    z: 0,
  };

  x!: number;

  y!: number;

  z!: number;
}
