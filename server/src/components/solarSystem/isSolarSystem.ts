import {AstronomicalUnit} from "server/src/utils/unitTypes";
import {Component} from "../utils";

export class IsSolarSystemComponent extends Component {
  static id: "isSolarSystem" = "isSolarSystem";

  habitableZoneInner: AstronomicalUnit = 0.9;
  habitableZoneOuter: AstronomicalUnit = 3.0;
  skyboxKey: string = "Random Key";
}
