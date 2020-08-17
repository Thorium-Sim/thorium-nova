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

// Habitable Zone Calculation
// This was created based on information from this page
// https://cosmicreflections.skythisweek.info/2017/06/08/habitable-zones/
// min and max are in AUs
// radius is the radius of the star in solar radii
// temperature is in kelvin
// 5777 is the temperature of Sol
function getHabitableZone(radius: number, temperature: number) {
  const min = 0.7 * radius * (temperature / 5777) ** 2;
  const max = 1.5 * radius * (temperature / 5777) ** 2;
  return {min, max};
}
