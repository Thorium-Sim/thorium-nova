import {Component, Types} from "ecsy";

export default class Acceleration extends Component<{}> {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

Acceleration.schema = {
  x: {type: Types.Number, default: 0},
  y: {type: Types.Number, default: 0},
  z: {type: Types.Number, default: 0},
};
