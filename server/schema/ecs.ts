import App from "../app";
import Entity from "../helpers/ecs/entity";
import {
  Arg,
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
import {InterstellarPositionComponent} from "server/components/ship/interstellarPosition";

@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return App.activeFlight?.ecs.entities;
  }
  @Query(returns => Entity, {nullable: true})
  async entity(@Arg("id", type => ID) id: string) {
    return App.activeFlight?.ecs.entities.find(e => e.id === id);
  }
}

export enum EntityTypes {
  system = "system",
  planet = "planet",
  star = "star",
  ship = "ship",
  outfit = "outfit",
  timer = "timer",
  waypoint = "waypoint",
}

export function getEntityType(entity: Entity) {
  if (entity.planetarySystem) return EntityTypes.system;
  if (entity.isPlanet) return EntityTypes.planet;
  if (entity.isStar) return EntityTypes.star;
  if (entity.isShip) return EntityTypes.ship;
  if (entity.timer) return EntityTypes.timer;
  if (entity.isOutfit) return EntityTypes.outfit;
  if (entity.isWaypoint) return EntityTypes.waypoint;
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
  // This allows easy access of the interstellar position of satellite entities, like Planets.
  @FieldResolver(type => InterstellarPositionComponent, {nullable: true})
  interstellarPosition(
    @Root() entity: Entity
  ): InterstellarPositionComponent | null {
    if (!entity.satellite) {
      return entity.interstellarPosition || null;
    }
    let testEntity = entity;
    // Go through all of the satellite parents until we find the planetary system.
    for (let i = 3; i >= 0; i++) {
      if (testEntity.planetarySystem) {
        return {systemId: testEntity.id};
      }
      const nextParent = App.activeFlight?.ecs.entities.find(
        e => e.id === testEntity.satellite?.parentId
      );
      if (!nextParent) return null;
      testEntity = nextParent;
    }
    return null;
  }
  @FieldResolver(type => Number)
  forwardVelocity(@Root() entity: Entity): number {
    const {velocity, rotation} = entity;
    if (!velocity || !rotation) return 0;
    const systems = entity.ecs?.entities.filter(
      e =>
        (e.warpEngines || e.impulseEngines) &&
        e.shipAssignment?.shipId === entity.id
    );
    const warpEngines = systems?.find(e => e.warpEngines);
    const impulseEngines = systems?.find(e => e.impulseEngines);

    const warpVelocity = warpEngines?.warpEngines?.forwardVelocity || 0;
    shipRotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    velocityObject.rotation.setFromQuaternion(shipRotationQuaternion);
    velocityObject.position.set(velocity.x, velocity.y, velocity.z);

    // Warp engines override impulse engines
    const impulseVelocity = warpVelocity
      ? 0
      : impulseEngines?.impulseEngines?.forwardVelocity || 0;
    const forwardVelocity =
      velocityObject.position.dot(
        forwardVector.set(0, 0, 1).applyQuaternion(shipRotationQuaternion)
      ) +
      warpVelocity +
      impulseVelocity;
    return forwardVelocity;
  }
}
