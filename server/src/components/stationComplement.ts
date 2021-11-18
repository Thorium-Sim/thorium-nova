import {Component} from "./utils";
import Station from "../classes/Station";

export class StationComplementComponent extends Component {
  static id: "stationComplement" = "stationComplement";

  stations: Station[] = [];
}
