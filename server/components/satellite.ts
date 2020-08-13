import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

// A component for anything which orbits another thing.
@ObjectType()
export class SatelliteComponent extends Component {
  static id: "satellite" = "satellite";
  static defaults: ComponentOmit<SatelliteComponent> = {
    axialTilt: 23.5,
    distance: 149600000,
    orbitalArc: 0,
    orbitalInclination: 0,
    eccentricity: 0.02,
    showOrbit: true,
  };

  @Field({description: "The tilt of the axis in degrees"})
  axialTilt: number = 23.5;

  @Field({description: "Distance from the center of its orbit in kilometers"})
  distance: number = 149600000;

  @Field({description: "Degrees where the planet currently is in its orbit"})
  orbitalArc: number = 0;

  @Field({
    description:
      "Degrees up or down where the planet is vertically in its orbit",
  })
  orbitalInclination: number = 0;

  @Field({description: "Degree to which the elliptical orbit is stretched"})
  eccentricity: number = 0.02;

  @Field({description: "Whether the orbit should be visible on the starmap"})
  showOrbit: boolean = true;

  parentId?: string | null = null;

  // If parent is an entity, it orbits that entity.
  // Otherwise, it's orbit is centered on the center of the planetary system
  @Field(type => Entity, {nullable: true})
  parent?: Entity | null;
}
