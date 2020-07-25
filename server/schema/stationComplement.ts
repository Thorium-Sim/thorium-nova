import {Field, ID, ObjectType} from "type-graphql";
import uuid from "uniqid";
import Station from "./station";

@ObjectType()
export default class StationComplement {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field(type => [Station])
  stations: Station[];

  constructor(params: Partial<StationComplement>) {
    this.id = params.id || uuid();
    this.name = params.name || "Bridge Complement";
    this.stations = [];
    params.stations?.forEach(station => {
      this.stations.push(new Station(station));
    });
  }
}
