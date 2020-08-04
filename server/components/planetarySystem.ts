import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class PlanetarySystemComponent extends Component {
  static id: "planetarySystem" = "planetarySystem";
  static defaults: ComponentOmit<PlanetarySystemComponent> = {
    habitableZoneInner: 0.9,
    habitableZoneOuter: 3.0,
  };

  @Field()
  habitableZoneInner: number = 0.9;

  @Field()
  habitableZoneOuter: number = 3.0;
}
