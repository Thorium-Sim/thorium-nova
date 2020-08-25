import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {planetTypes} from "./planetTypes";
import {getSystem, getSystemObject, objectPublish, publish} from "./utils";
import {toRoman} from "roman-numerals";
import {IsPlanetComponent} from "server/components/isPlanet";
import getHabitableZone from "server/generatorFixtures/habitableZone";
import {randomFromList} from "server/helpers/randomFromList";
import {PopulationComponent} from "server/components/population";
import {AU} from "./utils";

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
    const stars = universe.entities.filter(
      s => s.satellite?.parentId === systemId && s.isStar
    );

    // We'll use the habitable zone radius of the largest star
    const biggestStar = stars.reduce((prev: Entity | null, next) => {
      if (!prev || !prev.isStar) return next;
      if (!next.isStar) return prev;
      if (next.isStar.radius > prev.isStar.radius) return next;
      return prev;
    }, null);
    if (!biggestStar?.isStar || !biggestStar.temperature)
      return {min: minPlanetDistance, max: maxPlanetDistance};
    const tempZone = getHabitableZone(
      biggestStar.isStar?.radius,
      biggestStar.temperature?.temperature
    );
    const habitableZone = {
      min: Math.max(tempZone.min * AU, minPlanetDistance),
      max: Math.min(tempZone.max * AU, maxPlanetDistance),
    };

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
      orbitalArc: Math.round(Math.random() * 360),
      eccentricity: Math.round(Math.random() * 0.2 * 100) / 100,
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
  @Mutation(returns => Entity)
  universeTemplatePlanetSetTemperature(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("temperature", {description: "The temperature of the star in Kelvin"})
    temperature: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("temperature", {temperature});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplatePlanetSetAge(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("age", {description: "The age of the planet in years"})
    age: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {age});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplatePlanetSetRadius(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("radius", {description: "The radius of the planet in kilometers"})
    radius: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {radius});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplatePlanetSetTerranMass(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("terranMass", {
      description: "The mass of the planet compared to Earth",
    })
    terranMass: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {terranMass});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplatePlanetSetHabitable(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("habitable", {
      description: "Whether the planet is habitable by humans.",
    })
    habitable: boolean
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {habitable});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplatePlanetSetLifeforms(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("lifeforms", {
      description: "A text description of the lifeforms on the planet.",
    })
    lifeforms: string
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {lifeforms});
    return objectPublish(universe, object, system);
  }
}
