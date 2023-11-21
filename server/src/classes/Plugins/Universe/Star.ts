import {satellite} from "server/src/components/satellite";
import {SpectralTypes, starTypes} from "server/src/spawners/starTypes";
import {
  Degree,
  Kelvin,
  SolarMass,
  SolarRadius,
  Year,
} from "server/src/utils/unitTypes";
import type SolarSystemPlugin from "./SolarSystem";
import PlanetPlugin from "./Planet";

const ALPHABET = "ABC";

export default class StarPlugin {
  name: string;
  description: string;

  tags: string[];

  /**
   * The mass of the star in comparison to the Sun
   */
  solarMass: SolarMass;

  /**
   * The age of the star in years
   */
  age: Year;

  /**
   * The spectral type of the star, one of O,B,G,K,A,MG,M,D
   */
  spectralType: SpectralTypes;

  /**
   * The color hue of the star, based on the spectral type
   */
  hue: Degree;

  /**
   * Whether the star appears to be white
   */
  isWhite: boolean;

  /**
   * The radius of the star compared to the radius of the Sun
   */
  radius: SolarRadius;

  /**
   * Temperature in Kelvin (K)
   */
  temperature: Kelvin;

  satellite: Omit<Zod.infer<typeof satellite>, "parentId"> & {parentId: string};

  constructor(
    params: Partial<
      Omit<StarPlugin, "satellite"> & {
        satellite: Partial<
          Omit<Zod.infer<typeof satellite>, "parentId"> & {
            parentId: string;
          }
        >;
      }
    >,
    solarSystem: SolarSystemPlugin
  ) {
    this.name =
      params.name ||
      `${solarSystem.name} ${ALPHABET[solarSystem.stars.length]}`;
    this.description = params.description || "";
    this.tags = params.tags || [];

    this.solarMass = params.solarMass || 1;
    this.age = params.age || 4000000000;
    this.spectralType = params.spectralType || "G";
    this.hue = params.hue || 0;
    this.isWhite = params.isWhite || false;
    this.radius = params.radius || 1;

    this.temperature = params.temperature || 5800;

    this.satellite = {
      axialTilt: params.satellite?.axialTilt || 0,
      eccentricity: params.satellite?.eccentricity || 0,
      inclination: params.satellite?.inclination || 0,
      semiMajorAxis: params.satellite?.semiMajorAxis || 0,
      orbitalArc: params.satellite?.orbitalArc || 0,
      showOrbit: false,
      parentId: solarSystem.name,
    };
  }
}
