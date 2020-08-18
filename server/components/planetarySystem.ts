import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class PlanetarySystemComponent extends Component {
  static id: "planetarySystem" = "planetarySystem";
  static defaults: ComponentOmit<PlanetarySystemComponent> = {
    habitableZoneInner: 0.9,
    habitableZoneOuter: 3.0,
    skyboxKey: "Random Key",
  };

  @Field({
    description:
      "A string key that is used to procedurally generate the nebula skybox background in this system.",
  })
  skyboxKey: string = "Random Key";

  // TODO: Make these fields actually do something.
  @Field({description: "The inner radius of the habitable zone of the system."})
  habitableZoneInner: number = 0.9;

  @Field({description: "The outer radius of the habitable zone of the system."})
  habitableZoneOuter: number = 3.0;
}
