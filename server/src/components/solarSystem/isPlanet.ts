import {AtmosphericComposition} from "../../spawners/planetTypes";
import {Year, Kilometer, TerranMass} from "../../utils/unitTypes";
import {Component} from "../utils";

export class IsPlanetComponent extends Component {
  static id = "isPlanet" as const;
  /**
   * Age of the planet in years
   */
  age: Year = 4543000000;
  /**
   * Star Trek planetary classification can be found here: https://memory-alpha.fandom.com/wiki/Planetary_classification
   */
  classification: string = "M";
  /**
   * Radius of the planet in kilometers
   */
  radius: Kilometer = 3959;
  /**
   * Mass of the planet compared to Earth
   */
  terranMass: TerranMass = 1;
  /**
   * If the planet is habitable or not
   */
  isHabitable: boolean = true;
  /**
   * A description of lifeforms on the planet
   */
  lifeforms: string[] = ["Unknown"];
  /**
   * A list of the components that make up the planet's atmosphere
   */
  atmosphericComposition: AtmosphericComposition = [
    {component: "nitrogen", concentration: 100},
  ];
  /**
   * Image used for the texture of the planet's surface
   */
  textureMapAsset: string = "";
  /**
   * Image used for the texture of the planet's clouds
   */
  cloudMapAsset: string | null = null;
  /**
   * Image used for the texture of the planet's rings
   */
  ringMapAsset: string | null = null;
}
