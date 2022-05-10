import {SatelliteComponent} from "server/src/components/satellite";
import {IsPlanetComponent} from "server/src/components/solarSystem/isPlanet";

export default class PlanetPlugin {
  name: string;
  description: string;
  tags: string[];
  satellite: Omit<SatelliteComponent, "init" | "parentId"> & {
    parentId: string | null;
  };
  isPlanet: Omit<IsPlanetComponent, "init">;
  population: number;
  temperature: number;
  constructor(
    params: {name: string} & Partial<
      Omit<PlanetPlugin, "satellite"> & {
        satellite: Partial<
          Omit<SatelliteComponent, "init" | "parentId"> & {
            parentId: string | null;
          }
        >;
      }
    >
  ) {
    this.name = params.name;
    this.description = params.description || "";
    this.tags = params.tags || [];
    this.isPlanet = {
      age: params.isPlanet?.age || 0,
      classification: params.isPlanet?.classification || "M",
      radius: params.isPlanet?.radius || 3959,
      terranMass: params.isPlanet?.terranMass || 1,
      isHabitable: params.isPlanet?.isHabitable || true,
      lifeforms: params.isPlanet?.lifeforms || ["Unknown"],
      atmosphericComposition: params.isPlanet?.atmosphericComposition || [],
      textureMapAsset:
        params.isPlanet?.textureMapAsset ||
        "/plugins/Thorium Default/assets/default/planets/planet_textureAuric.jpg",
      cloudMapAsset: params.isPlanet?.cloudMapAsset || null,
      ringMapAsset: params.isPlanet?.ringMapAsset || null,
    };

    this.satellite = {
      axialTilt: params.satellite?.axialTilt || 0,
      eccentricity: params.satellite?.eccentricity || 0,
      inclination: params.satellite?.inclination || 0,
      semiMajorAxis: params.satellite?.semiMajorAxis || 0,
      orbitalArc: params.satellite?.orbitalArc || 0,
      showOrbit: true,
      parentId: params.satellite?.parentId || null,
    };

    this.population = params.population || 0;

    this.temperature = params.temperature || 5800;
  }
}
