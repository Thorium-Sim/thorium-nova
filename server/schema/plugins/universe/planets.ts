import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {planetTypes} from "./planetTypes";
import {getSystem, publish} from "./utils";
import {toRoman} from "roman-numerals";
import {IsPlanetComponent} from "server/components/isPlanet";
import getHabitableZone from "server/generatorFixtures/habitableZone";
import {randomFromList} from "server/helpers/randomFromList";
import {PopulationComponent} from "server/components/population";

type range = {min: number; max: number};
function randomFromRange({min, max}: range) {
  return Math.random() * (max - min) + min;
}

@Resolver()
export class UniversePluginPlanetsResolver {
  @Mutation(returns => Entity)
  async universeTemplateAddPlanet(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("classification", type => String)
    classification: string
  ) {
    const {universe, system} = getSystem(id, systemId);
    const childrenPlanets = universe.entities.filter(
      s => s.satellite?.parentId === systemId && s.isPlanet
    );

    const planetType = planetTypes.find(
      s => s.classification === classification
    );

    if (!planetType) {
      throw new Error(`Invalid planet classification: ${classification}`);
    }

    const name = `${system?.components?.identity?.name} ${toRoman(
      childrenPlanets.length + 1
    )}`;

    // Just less than the orbit of Neptune 🥶
    const maxPlanetDistance = 4000000000;

    // 1/5 the orbit of Mercury 🥵
    const minPlanetDistance = 10000000;

    // We'll do a messy thing with the habitable zone where we just the habitable zone values together
    const habitableZone: range = universe.entities
      .filter(s => s.satellite?.parentId === systemId && s.isStar)
      .reduce((prev: range | null, next) => {
        if (!next.isStar || !next.temperature) return prev;
        const habitableZone = getHabitableZone(
          next.isStar?.radius,
          next.temperature?.temperature
        );
        if (prev) {
          return {
            min: Math.max(prev.min + habitableZone.min, minPlanetDistance),
            max: Math.min(prev.max + habitableZone.max, maxPlanetDistance),
          };
        }
        return habitableZone;
      }, null) || {min: 52118000, max: 108550000};

    let distance = 0;
    const zone = randomFromList(planetType.systemZone);
    if (zone === "hot") {
      distance = Math.round(
        randomFromRange({min: minPlanetDistance, max: habitableZone.min})
      );
    }
    if (zone === "habitable") {
      distance = Math.round(randomFromRange(habitableZone));
    }
    if (zone === "cold") {
      distance = Math.round(
        randomFromRange({min: habitableZone.max, max: maxPlanetDistance})
      );
    }

    const entity = new Entity(null, [
      TagsComponent,
      IdentityComponent,
      IsPlanetComponent,
      TemperatureComponent,
      SatelliteComponent,
      PopulationComponent,
    ]);
    entity.updateComponent("identity", {name});
    entity.updateComponent("satellite", {
      axialTilt: Math.round(randomFromRange({min: 0, max: 45}) * 10) / 10,
      distance,
      orbitalArc: Math.random() * 360,
      eccentricity: Math.random() * 0.2,
      showOrbit: true,
      parentId: systemId,
    });
    entity.updateComponent("isPlanet", {
      age: Math.round(randomFromRange(planetType.ageRange)),
      classification,
      radius: Math.round(randomFromRange(planetType.radiusRange)),
      terranMass:
        Math.round(randomFromRange(planetType.terranMassRange) * 100) / 100,
      habitable: planetType.habitable,
      lifeforms: randomFromList(planetType.lifeforms),
      textureMapAsset: randomFromList(planetType.possibleTextureMaps),
      cloudMapAsset:
        planetType.hasClouds <= Math.random()
          ? randomFromList(planetType.possibleCloudMaps)
          : "",
      ringsMapAsset:
        planetType.hasRings <= Math.random()
          ? randomFromList(planetType.possibleRingMaps)
          : "",
    });

    entity.updateComponent("population", {
      count:
        typeof planetType.population === "number"
          ? planetType.population
          : Math.round(randomFromRange(planetType.population) / 1000) * 1000,
    });
    entity.updateComponent("temperature", {
      temperature: Math.round(randomFromRange(planetType.temperatureRange)),
    });
    universe.entities.push(entity);
    publish(universe);
    pubsub.publish("templateUniverseSystem", {id: system.id, system});
    return entity;
  }
}
