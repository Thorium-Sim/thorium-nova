import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsPlanetComponent extends Component {
  static id: "isPlanet" = "isPlanet";
  static defaults: Omit<ComponentOmit<IsPlanetComponent>, "surfaceGravity"> = {
    // Age in years
    age: 4543000000,
    // Star Trek planetary classification https://memory-alpha.fandom.com/wiki/Planetary_classification
    classification: "M",
    radius: 0.006371,
    terranMass: 1,
    habitable: false,
    lifeforms: "Unknown",
  };
  @Field({description: "The age in years"})
  age: number = 4000000000;

  @Field({
    description:
      "Star Trek planetary classification https://memory-alpha.fandom.com/wiki/Planetary_classification",
  })
  classification: string = "M";

  @Field({
    description:
      "Radius of the planet in kilometers. Earth's radius would be 6371",
  })
  // 1 unit = 1 million km
  // 0.001 unit = 1 million meters
  // 0.000000001 unit = 1 meter
  radius: number = 6371;

  @Field({
    description: "The mass of the planet compared to Earth.",
  })
  terranMass: number = 1;

  @Field({
    description: "Whether the planet is habitable or not",
  })
  habitable: boolean = false;

  @Field({
    description: "A description of the lifeforms on the planet",
  })
  lifeforms: string = "Unknown";

  @Field({
    description:
      "Surface gravity calculated with the equation (G * Mplanet) / Rplanet^2 where G is the gravitational constant.",
  })
  get surfaceGravity() {
    return 0;
  }
}
