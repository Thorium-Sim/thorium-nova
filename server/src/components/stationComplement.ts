import {Component} from "./utils";
import Station from "../classes/Station";
import uniqid from "@thorium/uniqid";

export class StationComplementComponent extends Component {
  static id: "stationComplement" = "stationComplement";

  id: string = uniqid("stc-");

  name: string = "Station Complement";

  hasShipMap: boolean = false;

  stations: Station[] = [];

  init(params: Partial<StationComplementComponent>) {
    super.init(params);
    this.stations = [];
    params.stations?.forEach(station => {
      this.stations.push(new Station(station));
    });
    return this;
  }
}
