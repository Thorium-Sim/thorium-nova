import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import UniverseTemplate from "server/schema/universe";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {starTypes} from "./starTypes";
import {getSystem, getUniverse, publish, removeUniverseObject} from "./utils";

const alphabet = "ABC";
type range = {min: number; max: number};
function randomFromRange({min, max}: range) {
  return Math.random() * (max - min) + min;
}

@Resolver()
export class UniversePluginStarsResolver {
  @Mutation(returns => Entity)
  async universeTemplateAddStar(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("spectralType", type => String)
    spectralType: string
  ) {
    const {universe, system} = getSystem(id, systemId);
    const childrenStars = universe.entities.filter(
      s => s.satellite?.parentId === systemId && s.isStar
    );

    const starType = starTypes.find(s => s.spectralType === spectralType);
    if (childrenStars.length >= 3) {
      throw new Error(`Only 3 stars are allowed`);
    }

    if (!starType) {
      throw new Error(`Invalid spectral type: ${spectralType}`);
    }

    // Let's assume that there are fewer than 26 stars in the system.
    const name = `${system?.components?.identity?.name} ${
      alphabet[childrenStars.length]
    }`;

    const radius =
      Math.round(randomFromRange(starType.radiusRange) * 10000) / 10000;

    // We need the radius of the sun to convert isStar.radius to kilometers
    const SUN_RADIUS = 6;
    // Calculate the distance of the star for binary systems
    let distance = 0;
    let orbitalArc = Math.random() * 360;
    if (childrenStars.length === 1) {
      const otherStar = childrenStars[0];
      distance = (radius + (otherStar.isStar?.radius || 0)) * SUN_RADIUS;
      orbitalArc = (otherStar.satellite?.orbitalArc || 0) + 180;
      if (otherStar.satellite) {
        otherStar.satellite.distance = distance;
      }
    }
    if (childrenStars.length === 2) {
      const star1 = childrenStars[0];
      const star2 = childrenStars[1];
      distance =
        (radius + (star1.isStar?.radius || 0) + (star2.isStar?.radius || 0)) *
        SUN_RADIUS;
      orbitalArc = (star1.satellite?.orbitalArc || 0) + 120;
      if (star1.satellite) {
        star1.satellite.distance = distance;
      }
      if (star2.satellite) {
        star2.satellite.orbitalArc = orbitalArc + 120;
        star2.satellite.distance = distance;
      }
    }

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
      distance,
      orbitalArc,
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
      radius,
    });
    entity.updateComponent("temperature", {
      temperature: Math.round(randomFromRange(starType.temperatureRange)),
    });
    universe.entities.push(entity);
    publish(universe);
    pubsub.publish("templateUniverseSystem", {id: system.id, system});
    return entity;
  }
  @Mutation(returns => String)
  universeTemplateRemoveObject(
    @Arg("id", type => ID) id: string,
    @Arg("objectId", type => ID) objectId: string
  ) {
    const universe = getUniverse(id);
    const object = universe.entities.find(s => s.id === objectId);
    if (!object) return "";
    const system = universe.entities.find(
      s => s.id === object.satellite?.parentId
    );

    removeUniverseObject(universe, objectId);

    publish(universe);
    if (system) {
      pubsub.publish("templateUniverseSystem", {id: system.id, system});
    }

    return "";
  }
}
