import {Component} from "./utils";

export class PositionComponent extends Component {
  // Note: When used with solar system components, position represents lightyears; otherwise it represents kilometers
  static id: "position" = "position";

  x: number = 0;

  y: number = 0;

  z: number = 0;
}
