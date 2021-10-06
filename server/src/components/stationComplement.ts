import {Component, ComponentOmit} from "./utils";
import Station from "../classes/Station";
import uniqid from "@thorium/uniqid";

export class StationComplementComponent extends Component {
  static id: "stationComplement" = "stationComplement";
  static defaults: ComponentOmit<StationComplementComponent> = {
    name: "Station Complement",
    stations: [],
  };

  id: string;

  name: string;

  stations: Station[];

  constructor(params: Partial<StationComplementComponent>) {
    super(params);
    this.id = params.id || uniqid("stc-");
    this.name = params.name || "Station Complement";
    this.stations = [];
    params.stations?.forEach(station => {
      this.stations.push(new Station(station));
    });
  }
}
