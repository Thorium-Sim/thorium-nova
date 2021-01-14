import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
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
  getPlugin,
  objectPublish,
  publishPluginUniverse,
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
  async pluginUniverseAddStar(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("spectralType", type => String)
    spectralType: string
  ) {
    const {plugin, system} = getSystem(id, systemId);
    const childrenStars = plugin.universe.filter(
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
    plugin.universe.push(entity);
    publishPluginUniverse(plugin);
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
    return entity;
  }

  @Query(returns => Entity, {name: "pluginUniverseObject"})
  pluginUniverseObjectQuery(
    @Arg("id", type => ID) id: string,
    @Arg("objectId", type => ID) objectId: string,
    @Ctx() ctx: GraphQLContext
  ) {
    ctx.pluginId = id;
    const {object} = getSystemObject(id, objectId);
    return object;
  }
  @Mutation(returns => String)
  pluginUniverseRemoveObject(
    @Arg("id", type => ID) id: string,
    @Arg("objectId", type => ID) objectId: string
  ) {
    const plugin = getPlugin(id);
    const object = plugin.universe.find(s => s.id === objectId);
    if (!object) return "";

    removeUniverseObject(plugin, objectId);

    publishPluginUniverse(plugin);
    if (object.satellite?.parentId) {
      const {system} = getSystem(id, object.satellite.parentId);
      if (system) {
        pubsub.publish("pluginUniverseSystem", {id: system.id, system});
      }
    }

    return "";
  }
  @Subscription(returns => Entity, {
    topics: ({args: {id, objectId}, payload}) => {
      const subId = uuid();
      process.nextTick(() => {
        const plugin = getPlugin(id);
        const object = plugin.universe.find(s => s.id === objectId);
        pubsub.publish(subId, {
          id: object?.id,
          pluginId: plugin.id,
          object,
        });
      });
      return [subId, "pluginUniverseObject"];
    },
    filter: ({payload, args: {id, objectId}}) => {
      return payload.id === objectId;
    },
  })
  pluginUniverseObject(
    @Root() payload: {pluginId: string; object: Entity},
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Ctx()
    context: GraphQLContext
  ): Entity {
    context.pluginId = payload.pluginId;
    return payload.object;
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetSolarMass(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("solarMass")
    solarMass: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {solarMass});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetAge(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("age")
    age: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {age});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetHue(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("hue")
    hue: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {hue});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetIsWhite(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("isWhite")
    isWhite: boolean
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {isWhite});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetRadius(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("radius")
    radius: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isStar", {radius});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseStarSetTemperature(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("temperature", {description: "The temperature of the star in Kelvin"})
    temperature: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("temperature", {temperature});
    return objectPublish(plugin, object, system);
  }
}
