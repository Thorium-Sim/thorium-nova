import {SpectralTypes} from "server/src/spawners/starTypes";
import {Degree, SolarMass, SolarRadius, Year} from "server/src/utils/unitTypes";
import {Component} from "../utils";

export class IsStarComponent extends Component {
  static id: "isStar" = "isStar";

  solarMass: SolarMass = 1;
  age: Year = 4_000_000_000;
  spectralType: SpectralTypes = "G";
  hue: Degree = 0;
  isWhite: boolean = false;
  radius: SolarRadius = 1;
}
