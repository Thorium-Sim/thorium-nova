import {Range} from "../utils/randomFromRange";
import {Degree, Kelvin, SolarMass, SolarRadius, Year} from "../utils/unitTypes";

export type SpectralTypes = "O" | "B" | "G" | "K" | "A" | "MG" | "M" | "D";

interface StarType {
  name: string;
  spectralType: SpectralTypes;
  /**
   * The percentage of stars that are this type.
   */
  prevalence: number;
  /**
   * Temperature of the star in Kelvin
   */
  temperatureRange: Range<Kelvin>;
  /**
   * Mass as compared to the Sun
   */
  solarMassRange: Range<SolarMass>;
  /**
   * Age of the star in years
   */
  ageRange: Range<Year>;

  /**
   * The radius range compared to the Sun
   */
  radiusRange: Range<SolarRadius>;
  hueRange: Range<Degree>;
  white?: boolean;
}

export const starTypes: StarType[] = [
  {
    name: "Blue",
    spectralType: "B",
    prevalence: 0.015,
    temperatureRange: {min: 28000, max: 33000},
    solarMassRange: {min: 2.5, max: 90},
    ageRange: {min: 38000000, max: 42000000},
    radiusRange: {min: 2.7, max: 10},
    hueRange: {min: 195, max: 250},
  },
  {
    name: "Blue Giant",
    spectralType: "O",
    prevalence: 0.015,
    temperatureRange: {min: 10000, max: 50000},
    solarMassRange: {min: 20, max: 1000},
    ageRange: {min: 8000000, max: 12000000},
    radiusRange: {min: 18, max: 22},
    hueRange: {min: 220, max: 270},
  },
  {
    name: "Red Giant",
    spectralType: "MG",
    prevalence: 0.06,
    temperatureRange: {min: 3300, max: 5300},
    solarMassRange: {min: 0.3, max: 10},
    ageRange: {min: 100000000, max: 2000000000},
    radiusRange: {min: 20, max: 100},
    hueRange: {min: 0, max: 20},
  },
  {
    name: "Yellow Dwarf",
    spectralType: "G",
    prevalence: 0.11,
    temperatureRange: {min: 5200, max: 7500},
    solarMassRange: {min: 0.8, max: 1.4},
    ageRange: {min: 4000000000, max: 17000000000},
    radiusRange: {min: 0.9, max: 1.4},
    hueRange: {min: 40, max: 60},
  },
  {
    name: "Orange Dwarf",
    spectralType: "K",
    prevalence: 0.12,
    temperatureRange: {min: 3700, max: 5200},
    solarMassRange: {min: 0.45, max: 0.8},
    ageRange: {min: 15000000000, max: 30000000000},
    radiusRange: {min: 0.7, max: 0.9},
    hueRange: {min: 20, max: 40},
  },
  {
    name: "White Dwarf",
    spectralType: "D",
    prevalence: 0.2,
    temperatureRange: {min: 3300, max: 5300},
    solarMassRange: {min: 0.3, max: 10},
    ageRange: {min: 100000000, max: 2000000000},
    radiusRange: {min: 0.01, max: 0.04},
    hueRange: {min: 0, max: 20},
    white: true,
  },
  {
    name: "Red Dwarf",
    spectralType: "M",
    prevalence: 0.5,
    temperatureRange: {min: 8000, max: 40000},
    solarMassRange: {min: 0.1, max: 1.4},
    ageRange: {min: 100000, max: 10000000000},
    radiusRange: {min: 0.008, max: 0.2},
    hueRange: {min: 0, max: 1},
  },
];
