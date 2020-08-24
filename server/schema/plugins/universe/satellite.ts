import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import UniverseTemplate from "server/schema/universe";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getSystemObject, publish} from "./utils";

function satellitePublish(
  universe: UniverseTemplate,
  object: Entity,
  system?: Entity
) {
  publish(universe);
  if (system) {
    pubsub.publish("templateUniverseSystem", {id: system.id, system});
  }
  return object;
}
@Resolver()
export class UniverseSatelliteResolver {
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetAxialTilt(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("axialTilt")
    axialTilt: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {axialTilt});
    return satellitePublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetDistance(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("distance")
    distance: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {distance});
    return satellitePublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetOrbitalArc(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("orbitalArc")
    orbitalArc: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {orbitalArc});
    return satellitePublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetOrbitalInclination(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("orbitalInclination")
    orbitalInclination: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {orbitalInclination});
    return satellitePublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetEccentricity(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("eccentricity")
    eccentricity: number
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {eccentricity});
    return satellitePublish(universe, object, system);
  }
  @Mutation(returns => Entity)
  universeTemplateSatelliteSetShowOrbit(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("showOrbit")
    showOrbit: boolean
  ) {
    const {universe, object, system} = getSystemObject(id, objectId);
    object.updateComponent("satellite", {showOrbit});
    return satellitePublish(universe, object, system);
  }
}
