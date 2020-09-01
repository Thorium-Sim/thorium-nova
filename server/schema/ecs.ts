import App from "../app";
import Entity from "../helpers/ecs/entity";
import {
  Ctx,
  FieldResolver,
  Query,
  registerEnumType,
  Resolver,
  Root,
} from "type-graphql";
import {ShipAssetsComponent} from "server/components/shipAssets";
import {SatelliteComponent} from "server/components/satellite";
import {GraphQLContext} from "server/helpers/graphqlContext";

@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return App.activeFlight?.ecs.entities;
  }
}

enum EntityTypes {
  system = "system",
  planet = "planet",
  star = "star",
  ship = "ship",
  timer = "timer",
}

registerEnumType(EntityTypes, {name: "EntityTypes"});
@Resolver(of => Entity)
export class EntityFieldResolver {
  @FieldResolver(type => EntityTypes)
  entityType(@Root() entity: Entity): EntityTypes {
    if (entity.planetarySystem) return EntityTypes.system;
    if (entity.isPlanet) return EntityTypes.planet;
    if (entity.isStar) return EntityTypes.star;
    if (entity.isShip) return EntityTypes.ship;
    if (entity.timer) return EntityTypes.timer;
    console.error(entity);
    throw new Error("Unknown entity type for entity. Check the logs.");
  }
  @FieldResolver()
  shipAssets(@Root() entity: Entity): ShipAssetsComponent {
    // @ts-ignore
    return {...entity.shipAssets, entity};
  }
  @FieldResolver(type => SatelliteComponent, {nullable: true})
  satellite(
    @Root() entity: Entity,
    @Ctx() ctx: GraphQLContext
  ): SatelliteComponent | null {
    if (!entity.satellite) return null;
    return ({...entity.satellite, entity} as unknown) as SatelliteComponent;
  }
}
