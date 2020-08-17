import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {starTypes} from "./starTypes";
import {getSystem, publish} from "./utils";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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

    const starType = starTypes.find(s => s.spectralType === spectralType);

    if (!starType) {
      throw new Error(`Invalid spectral type: ${spectralType}`);
    }

    // Let's assume that there are fewer than 26 stars in the system.
    const name = `${system?.components?.identity?.name} ${
      alphabet[childrenStars.length]
    }`;

    const entity = new Entity(null, [
      TagsComponent,
      IdentityComponent,
      IsStarComponent,
      TemperatureComponent,
      SatelliteComponent,
    ]);
    entity.updateComponent("identity", {name});
    entity.updateComponent("satellite", {
      axialTilt: 0,
      distance: 0,
      orbitalArc: Math.random() * 360,
      eccentricity: 0,
      showOrbit: false,
      parentId: systemId,
    });
    entity.updateComponent("isStar", {
      solarMass: Math.round(randomFromRange(starType.solarMassRange) * 10) / 10,
      age: Math.round(randomFromRange(starType.ageRange)),
      spectralType: starType.spectralType,
      hue: Math.round(randomFromRange(starType.hueRange)),
      isWhite: starType.white || false,
      radius: Math.round(randomFromRange(starType.radiusRange) * 10000) / 10000,
    });
    entity.updateComponent("temperature", {
      temperature: Math.round(randomFromRange(starType.temperatureRange)),
    });
    universe.entities.push(entity);
    publish(universe);
    pubsub.publish("templateUniverseSystem", {system});
    return entity;
  }
}
