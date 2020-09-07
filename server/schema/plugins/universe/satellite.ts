import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import BasePlugin from "../basePlugin";
import {getSystemObject, publish} from "./utils";

function satellitePublish(plugin: BasePlugin, object: Entity, system?: Entity) {
  publish(plugin);
  if (system) {
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
  }
  return object;
}
@Resolver()
export class UniverseSatelliteResolver {
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetAxialTilt(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("axialTilt")
    axialTilt: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {axialTilt});
    return satellitePublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetDistance(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("distance")
    distance: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {distance});
    return satellitePublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetOrbitalArc(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("orbitalArc")
    orbitalArc: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {orbitalArc});
    return satellitePublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetOrbitalInclination(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("orbitalInclination")
    orbitalInclination: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {orbitalInclination});
    return satellitePublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetEccentricity(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("eccentricity")
    eccentricity: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {eccentricity});
    return satellitePublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniverseSatelliteSetShowOrbit(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("showOrbit")
    showOrbit: boolean
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {showOrbit});
    return satellitePublish(plugin, object, system);
  }
}
