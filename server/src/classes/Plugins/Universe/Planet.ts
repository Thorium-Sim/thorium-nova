import { SatelliteComponent } from "server/src/components/satellite";
import {
    Kilometer,
  } from "server/src/utils/unitTypes";
import StarPlugin from "./Star";
import { IsPlanetComponet } from "server/src/components/isPlanet";
import { PopulationComponent } from "server/src/components/population";
import { TemperatureComponent } from "server/src/components/temperature";

export default class PlanetPlugin {
    name: string;
    description: string;
    tags: string[];
    //what does omit do? should I do it for the other three components?
    satellite: Omit<SatelliteComponent, "init">;
    isPlanet: Omit<IsPlanetComponet, "init">;
    population: Omit<PopulationComponent, "init">;
    temperature: Omit<TemperatureComponent, "init">;
    constructor(
      params: Partial<
        Omit<PlanetPlugin, "satellite"> & {
          satellite: Partial<Omit<SatelliteComponent, "init">>;
        }
      >,
      star: StarPlugin
    ) {
      this.name =
        params.name ||
        `${star.name} ${[star.planets.length]}`;
      this.description = params.description || "";
      this.tags = params.tags || [];
      this.isPlanet = {
        age: params.isPlanet?.age || 0,
        classification: params.isPlanet?.classification || "M",
        radius: params.isPlanet?.radius || 3959,
        terranMass: params.isPlanet?.terranMass || 1,
        isHabitable: params.isPlanet?.isHabitable || true,
        lifeforms: params.isPlanet?.lifeforms || ["Unknown"],
        zone: params.isPlanet?.zone || ["habitable"],
        atmosphericComposition: params.isPlanet?.atmosphericComposition || [],
        hasRings: params.isPlanet?.hasRings || 0,
        hasClouds: params.isPlanet?.hasClouds || 0,
      }
      
      this.satellite = {
        axialTilt: params.satellite?.axialTilt || 0,
        eccentricity: params.satellite?.eccentricity || 0,
        inclination: params.satellite?.inclination || 0,
        semiMajorAxis: params.satellite?.semiMajorAxis || 0,
        orbitalArc: params.satellite?.orbitalArc || 0,
        showOrbit: true,
        parentId: star.name,
      };

      this.population = {
        count: params.population?.count || 0,
      }

      this.temperature = {
        temperature: params.temperature?.temperature || 5800,
      }
    }
  }