import {Field, ID, ObjectType, Query, Resolver} from "type-graphql";

const possibleRingMaps = [
  "/assets/textures/rings1.png",
  "/assets/textures/rings2.png",
  "/assets/textures/rings3.png",
  "/assets/textures/rings4.png",
];
type range = {min: number; max: number};
type atmosphericComposition = {component: string; concentration: number}[];
@ObjectType()
export class PlanetType {
  @Field(type => ID)
  id: string;
  @Field()
  name: string;
  @Field(type => String)
  classification:
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "S";
  temperatureRange: range;
  // This determines the distance from the planet to the star
  systemZone: ("hot" | "cold" | "habitable")[];
  // Radius in km
  radiusRange: range;
  ageRange: range;
  // Range of the mass of the planet relative to Earth
  terranMassRange: range;
  // Population is a factor of the class of planet (L, M, N, O, P) and the radius
  population: number | range;
  atmosphericComposition: atmosphericComposition;
  habitable: boolean;
  lifeforms: string[];

  possibleTextureMaps: string[];

  // The likelihood the planet has rings.
  hasRings: number;
  possibleRingMaps: string[];

  // The likelihood the planet has clouds.
  hasClouds: number;
  possibleCloudMaps: string[];

  constructor(params: Omit<PlanetType, "id">) {
    this.id = params.name;
    this.name = params.name;
    this.classification = params.classification;
    this.temperatureRange = params.temperatureRange;
    this.systemZone = params.systemZone;
    this.radiusRange = params.radiusRange;
    this.ageRange = params.ageRange;
    this.temperatureRange = params.temperatureRange;
    this.terranMassRange = params.terranMassRange;
    this.population = params.population;
    this.atmosphericComposition = params.atmosphericComposition;
    this.habitable = params.habitable;
    this.lifeforms = params.lifeforms;
    this.possibleTextureMaps = params.possibleTextureMaps;
    this.hasRings = params.hasRings;
    this.possibleRingMaps = params.possibleRingMaps;
    this.hasClouds = params.hasClouds;
    this.possibleCloudMaps = params.possibleCloudMaps;
  }
}

// Surface Gravity (a product of mass)
// Gravity = (G * Mplanet) / Rplanet^2

export const planetTypes = [
  new PlanetType({
    classification: "A",
    name: "Geothermal",
    ageRange: {min: 1000000, max: 2000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 500, max: 5000},
    systemZone: ["habitable", "cold"],
    temperatureRange: {min: 1383, max: 1783},
    terranMassRange: {min: 0.1, max: 1.2},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/planet_textureAuric.jpg",
      "/assets/textures/planet_textureAcid.jpg",
      "/assets/textures/mercurymap.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "B",
    name: "Geomorteus",
    ageRange: {min: 1000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 500, max: 5000},
    systemZone: ["hot"],
    temperatureRange: {min: 90, max: 740},
    terranMassRange: {min: 0.1, max: 1.2},
    hasClouds: 0,
    hasRings: 0,

    possibleTextureMaps: [
      "/assets/textures/2k_mercury.jpg",
      "/assets/textures/plutomap1k.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "C",
    name: "Geoinactive",
    ageRange: {min: 20000000, max: 1000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 500, max: 5000},
    systemZone: ["habitable", "cold"],
    temperatureRange: {min: 33, max: 55},
    terranMassRange: {min: 0.1, max: 1},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/planet_textureDust.jpg",
      "/assets/textures/planet_textureAzure.jpg",
      "/assets/textures/planet_textureChondrite.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "D",
    name: "Planetoid/Moon",
    ageRange: {min: 20000000, max: 1000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 50, max: 500},
    systemZone: ["hot", "habitable", "cold"],
    temperatureRange: {min: 146, max: 400},
    terranMassRange: {min: 0.01, max: 0.4},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/2k_moon.jpg",
      "/assets/textures/Icy.jpg",
      "/assets/textures/planet_textureBurnt.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "E",
    name: "Geoplastic",
    ageRange: {min: 1000000, max: 2000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 800, max: 1443},
    terranMassRange: {min: 0.1, max: 1.5},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/planet_textureHot_light.jpg",
      "/assets/textures/planet_textureHot.jpg",
      "/assets/textures/Volcanic.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "F",
    name: "Geometallic",
    ageRange: {min: 1000000000, max: 3000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None"],
    population: 0,
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 500, max: 900},
    terranMassRange: {min: 0.1, max: 1.5},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/planet_textureCimmerian.jpg",
      "/assets/textures/planet_textureCrimson.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "G",
    name: "Geocrystalline",
    ageRange: {min: 3000000000, max: 4000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: ["None", "Primitive single-celled organisms"],
    population: 0,
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 400, max: 600},
    terranMassRange: {min: 0.5, max: 1.5},
    hasClouds: 0,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/planet_textureCarbide.jpg",
      "/assets/textures/planet_textureChlorine.jpg",
    ],
    possibleCloudMaps: [],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "H",
    name: "Desert",
    ageRange: {min: 4000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: [
      "None",
      "Primitive single-celled organisms",
      "Draught-resistant plants",
    ],
    population: 0,
    radiusRange: {min: 4000, max: 7500},
    systemZone: ["hot"],
    temperatureRange: {min: 500, max: 900},
    terranMassRange: {min: 0.1, max: 1.5},
    hasClouds: 0.7,
    hasRings: 0,
    possibleTextureMaps: [
      "/assets/textures/2k_venus_atmosphere.jpg",
      "/assets/textures/planet_textureDesertic.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/clouds_textureSoft.png",
      "/assets/textures/Clouds1.png",
    ],
    possibleRingMaps: [],
  }),
  new PlanetType({
    classification: "I",
    name: "Gas Supergiant",
    ageRange: {min: 2000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: [
      "None",
      "Floating single-celled lifeforms",
      "Hydrocarbon-based gas bag animals",
    ],
    population: 0,
    radiusRange: {min: 70000, max: 5000000},
    systemZone: ["cold"],
    temperatureRange: {min: 128, max: 340},
    terranMassRange: {min: 300, max: 1000},
    hasClouds: 0.4,
    hasRings: 0.8,
    possibleTextureMaps: [
      "/assets/textures/2k_saturn.jpg",
      "/assets/textures/2k_jupiter.jpg",
      "/assets/textures/planet_textureFluorescent.jpg",
      "/assets/textures/planet_textureBlueGiant.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/clouds_textureGiant.png",
      "/assets/textures/clouds_textureGiantSharp.png",
      "/assets/textures/clouds_textureSwept.png",
      "/assets/textures/Clouds4.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "J",
    name: "Gas Giant",
    ageRange: {min: 2000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: false,
    lifeforms: [
      "None",
      "Floating single-celled lifeforms",
      "Hydrocarbon-based gas bag animals",
    ],
    population: 0,
    radiusRange: {min: 25000, max: 70000},
    systemZone: ["cold"],
    temperatureRange: {min: 128, max: 340},
    terranMassRange: {min: 10, max: 100},
    hasClouds: 0.4,
    hasRings: 0.8,
    possibleTextureMaps: [
      "/assets/textures/2k_neptune.jpg",
      "/assets/textures/2k_uranus.jpg",
      "/assets/textures/Gaseous2.jpg",
      "/assets/textures/Gaseous1.jpg",
      "/assets/textures/Gaseous3.jpg",
      "/assets/textures/Gaseous4.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/clouds_textureGiant.png",
      "/assets/textures/clouds_textureGiantSharp.png",
      "/assets/textures/clouds_textureSwept.png",
      "/assets/textures/Clouds4.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "K",
    name: "Adaptable",
    ageRange: {min: 4000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["None", "Primitive single-celled organisms"],
    population: {min: 0, max: 50000},
    radiusRange: {min: 2500, max: 5000},
    systemZone: ["habitable"],
    temperatureRange: {min: 117, max: 303},
    terranMassRange: {min: 0.1, max: 1.5},
    hasClouds: 0.4,
    hasRings: 0.2,
    possibleTextureMaps: [
      "/assets/textures/planet_textureAlkali.jpg",
      "/assets/textures/planet_textureCyanic.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/clouds_textureSoft.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "L",
    name: "Martian",
    ageRange: {min: 4000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["Primitive single-celled organisms", "Hardy plant life"],
    population: {min: 0, max: 50000},
    radiusRange: {min: 2500, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 150, max: 330},
    terranMassRange: {min: 0.1, max: 1.5},
    hasClouds: 0.4,
    hasRings: 0.3,
    possibleTextureMaps: ["/assets/textures/Martian.jpg"],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/clouds_textureSoft.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "M",
    name: "Terrestrial",
    ageRange: {min: 3000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["Varied and extensive vegetation and animal life, humanoids"],
    population: {min: 10000000, max: 10000000000},
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 288, max: 303},
    terranMassRange: {min: 0.5, max: 1.5},
    hasClouds: 1,
    hasRings: 0.5,
    possibleTextureMaps: [
      "/assets/textures/Terrestrial1.jpg",
      "/assets/textures/Terrestrial2.jpg",
      "/assets/textures/Terrestrial3.jpg",
      "/assets/textures/Terrestrial4.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/Clouds2.png",
      "/assets/textures/Clouds3.png",
      "/assets/textures/clouds_textureSoft.png",
      "/assets/textures/clouds_textureMedium.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "N",
    name: "Venusian",
    ageRange: {min: 3000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["Aquatic-based vegetation and animal life, humanoids"],
    population: {min: 5000000, max: 700000000},
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 350, max: 735},
    terranMassRange: {min: 0.5, max: 1.5},
    hasClouds: 1,
    hasRings: 0.5,
    possibleTextureMaps: [
      "/assets/textures/Venusian.jpg",
      "/assets/textures/2k_venus_surface.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/Clouds2.png",
      "/assets/textures/Clouds3.png",
      "/assets/textures/clouds_textureSoft.png",
      "/assets/textures/clouds_textureMedium.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "O",
    name: "Oceanic",
    ageRange: {min: 3000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["Aquatic-based vegetation and animal life, humanoids"],
    population: {min: 5000000, max: 700000000},
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 290, max: 303},
    terranMassRange: {min: 0.5, max: 1.5},
    hasClouds: 1,
    hasRings: 0.5,
    possibleTextureMaps: [
      "/assets/textures/Tropical.jpg",
      "/assets/textures/Swamp.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/Clouds2.png",
      "/assets/textures/Clouds3.png",
      "/assets/textures/clouds_textureSoft.png",
      "/assets/textures/clouds_textureMedium.png",
    ],
    possibleRingMaps,
  }),
  new PlanetType({
    classification: "P",
    name: "Glaciated",
    ageRange: {min: 3000000000, max: 10000000000},
    atmosphericComposition: [],
    habitable: true,
    lifeforms: ["Hardy vegetation, animal life, humanoids"],
    population: {min: 20000, max: 200000},
    radiusRange: {min: 5000, max: 7500},
    systemZone: ["habitable"],
    temperatureRange: {min: 255, max: 270},
    terranMassRange: {min: 0.5, max: 1.5},
    hasClouds: 1,
    hasRings: 0.5,
    possibleTextureMaps: [
      "/assets/textures/Icy.jpg",
      "/assets/textures/Alpine.jpg",
    ],
    possibleCloudMaps: [
      "/assets/textures/Clouds1.png",
      "/assets/textures/Clouds2.png",
      "/assets/textures/Clouds3.png",
      "/assets/textures/clouds_textureSoft.png",
      "/assets/textures/clouds_textureMedium.png",
    ],
    possibleRingMaps,
  }),
];

@Resolver()
class PlanetTypeResolver {
  @Query(returns => [PlanetType])
  planetTypes(): PlanetType[] {
    return planetTypes;
  }
}

export default PlanetTypeResolver;
