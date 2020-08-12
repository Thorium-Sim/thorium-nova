import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

// A component for anything which orbits another thing.
@ObjectType()
export class SatelliteComponent extends Component {
  static id: "satellite" = "satellite";
  static defaults: ComponentOmit<SatelliteComponent> = {
    // The tilt of the axis in degrees
    axialTilt: 23.5,
    // Distance from the center of its orbit in kilometers
    distance: 149600000,
    // Degrees where the planet currently is in its orbit
    orbitalArc: 0,
    // Degrees up or down where the planet is vertically in its orbit
    orbitalInclination: 0,
    // Degree to which the elliptical orbit is stretched
    eccentricity: 0.02,
  };

  @Field()
  axialTilt: number = 23.5;

  @Field()
  distance: number = 149600000;

  @Field()
  orbitalArc: number = 0;

  @Field()
  orbitalInclination: number = 0;

  @Field()
  eccentricity: number = 0.02;

  parentId?: string | null = null;

  // If parent is an entity, it orbits that entity.
  // Otherwise, it's orbit is centered on the center of the planetary system
  @Field(type => Entity, {nullable: true})
  parent?: Entity | null;
}
