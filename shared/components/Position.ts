import {Component, Types} from "ecsy";

export default class Position extends Component<{}> {
  static interpolate = true;
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

Position.schema = {
  x: {type: Types.Number, default: 0},
  y: {type: Types.Number, default: 0},
  z: {type: Types.Number, default: 0},
};
