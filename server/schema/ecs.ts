import App from "../app";
import Entity from "../helpers/ecs/entity";
import {Ctx, FieldResolver, Query, Resolver, Root} from "type-graphql";
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

@Resolver(of => Entity)
export class EntityFieldResolver {
  @FieldResolver()
  shipAssets(@Root() entity: Entity): ShipAssetsComponent {
    // @ts-ignore
    return {...entity.shipAssets, entity};
  }
  @FieldResolver()
  satellite(
    @Root() entity: Entity,
    @Ctx() ctx: GraphQLContext
  ): SatelliteComponent {
    return ({...entity.satellite, entity} as unknown) as SatelliteComponent;
  }
}
