import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import UniverseTemplate from "server/schema/universe";
import {
  Arg,
  Ctx,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {starTypes} from "./starTypes";
import {
  getSystem,
  getSystemObject,
  getUniverse,
  objectPublish,
  publish,
  removeUniverseObject,
} from "./utils";
import uuid from "uniqid";
import {string} from "prop-types";
import {GraphQLContext} from "server/helpers/graphqlContext";

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

  @Query(returns => Entity)
  universeTemplateObject(
    @Arg("id", type => ID) id: string,
    @Arg("objectId", type => ID) objectId: string
  ) {
    const {object} = getSystemObject(id, objectId);
    return object;
  }
  @Mutation(returns => String)
  universeTemplateRemoveObject(
    @Arg("id", type => ID) id: string,
    @Arg("objectId", type => ID) objectId: string
  ) {
    const universe = getUniverse(id);
    const object = universe.entities.find(s => s.id === objectId);
    if (!object) return "";

    removeUniverseObject(universe, objectId);

    publish(universe);
    if (object.satellite?.parentId) {
      const {system} = getSystem(id, object.satellite.parentId);
      if (system) {
        pubsub.publish("templateUniverseSystem", {id: system.id, system});
      }
    }

    return "";
  }
  @Subscription(returns => Entity, {
    topics: ({args: {id, objectId}, payload}) => {
      const subId = uuid();
      process.nextTick(() => {
        const universe = getUniverse(id);
        const object = universe.entities.find(s => s.id === objectId);
        pubsub.publish(subId, {
          id: object?.id,
          universeId: universe.id,
          object,
        });
      });
      return [subId, "templateUniverseObject"];
    },
    filter: ({payload, args: {id, objectId}}) => {
      return payload.id === objectId;
    },
  })
  templateUniverseObject(
    @Root() payload: {universeId: string; object: Entity},
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Ctx()
    context: GraphQLContext
  ): Entity {
    context.universeId = payload.universeId;
    return payload.object;
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetSolarMass(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("solarMass")
    solarMass: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {solarMass});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetAge(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("age")
    age: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {age});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetHue(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("hue")
    hue: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {hue});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetIsWhite(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("isWhite")
    isWhite: boolean
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {isWhite});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetRadius(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("radius")
    radius: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {radius});
    return objectPublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateStarSetTemperature(
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
}
