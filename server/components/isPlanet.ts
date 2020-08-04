import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsPlanet extends Component {
  static id: "isPlanet" = "isPlanet";
  static defaults: ComponentOmit<IsPlanet> = {
    // The tilt of the axis in degrees
    axialTilt: 23.5,
    // Age in years
    age: 4543000000,
    // Distance from the center of its orbit in kilometers
    distance: 149600000,
    // Degrees where the planet currently is in its orbit
    orbitalArc: 0,
    // Degrees up or down where the planet is vertically in its orbit
    orbitalInclination: 0,
    // Star Trek planetary classification https://memory-alpha.fandom.com/wiki/Planetary_classification
    class: "M",
  };

  @Field()
  axialTilt: number = 23.5;

  @Field()
  age: number = 4000000000;

  @Field()
  distance: number = 149600000;

  @Field()
  orbitalArc: number = 0;

  @Field()
  orbitalInclination: number = 0;

  @Field()
  class: string = "M";

  parentId?: string | null = null;

  // If parent is an entity, it orbits that entity.
  // Otherwise, it's orbit is centered on the center of the planetary system
  @Field({nullable: true})
  parent?: Entity | null;
}
