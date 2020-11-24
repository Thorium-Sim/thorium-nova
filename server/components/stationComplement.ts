import {Field, ID, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";
import Station from "../schema/station";
import uuid from "uniqid";

@ObjectType()
export class StationComplementComponent extends Component {
  static id: "stationComplement" = "stationComplement";
  static defaults: ComponentOmit<StationComplementComponent> = {
    name: "Station Complement",
    stations: [],
  };

  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field(type => [Station])
  stations: Station[];

  constructor(params: Partial<StationComplementComponent>) {
    super();
    this.id = params.id || uuid();
    this.name = params.name || "Station Complement";
    this.stations = [];
    params.stations?.forEach(station => {
      this.stations.push(new Station(station));
    });
  }
}
