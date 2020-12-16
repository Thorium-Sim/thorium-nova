import App from "../app";
import Entity from "../helpers/ecs/entity";
import {
  Ctx,
  FieldResolver,
  ID,
  Query,
  registerEnumType,
  Resolver,
  Root,
} from "type-graphql";
import {ShipAssetsComponent} from "server/components/ship/shipAssets";
import {SatelliteComponent} from "server/components/satellite";
import {GraphQLContext} from "server/helpers/graphqlContext";
import BasePlugin, {getPlugin} from "./plugins/basePlugin";
import {Object3D, Quaternion, Vector3} from "three";

@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return App.activeFlight?.ecs.entities;
  }
}

export enum EntityTypes {
  system = "system",
  planet = "planet",
  star = "star",
  ship = "ship",
  outfit = "outfit",
  timer = "timer",
}

export function getEntityType(entity: Entity) {
  if (entity.planetarySystem) return EntityTypes.system;
  if (entity.isPlanet) return EntityTypes.planet;
  if (entity.isStar) return EntityTypes.star;
  if (entity.isShip) return EntityTypes.ship;
  if (entity.timer) return EntityTypes.timer;
  if (process.env.NODE_ENV !== "test") {
    console.error(entity);
  }
  throw new Error("Unknown entity type for entity. Check the logs.");
}

const shipRotationQuaternion = new Quaternion();
const forwardVector = new Vector3();
const velocityObject = new Object3D();

registerEnumType(EntityTypes, {name: "EntityTypes"});
@Resolver(of => Entity)
export class EntityFieldResolver {
  @FieldResolver(type => ID)
  id(@Root() entity: Entity, @Ctx() context: GraphQLContext) {
    context.entity = entity;
    return entity.id;
  }
  @FieldResolver(type => BasePlugin, {nullable: true})
  plugin(@Root() entity: Entity) {
    return entity.pluginId && getPlugin(entity.pluginId);
  }
  @FieldResolver(type => EntityTypes)
  entityType(@Root() entity: Entity): EntityTypes {
    return getEntityType(entity);
  }
  @FieldResolver(type => ShipAssetsComponent, {nullable: true})
  shipAssets(
    @Root() entity: Entity,
    @Ctx() context: GraphQLContext
  ): ShipAssetsComponent | null {
    context.pluginId = entity.pluginId;
    return entity.shipAssets || null;
  }
  @FieldResolver(type => SatelliteComponent, {nullable: true})
  satellite(@Root() entity: Entity): SatelliteComponent | null {
    if (!entity.satellite) return null;
    return ({...entity.satellite, entity} as unknown) as SatelliteComponent;
  }
  @FieldResolver(type => Number)
  forwardVelocity(@Root() entity: Entity): number {
    const {velocity, rotation} = entity;
    if (!velocity || !rotation) return 0;
    shipRotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    velocityObject.rotation.setFromQuaternion(shipRotationQuaternion);
    velocityObject.position.set(velocity.x, velocity.y, velocity.z);
    const forwardVelocity = velocityObject.position.dot(
      forwardVector.set(0, 0, 1).applyQuaternion(shipRotationQuaternion)
    );
    return forwardVelocity;
  }
}
