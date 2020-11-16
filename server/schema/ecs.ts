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
}
