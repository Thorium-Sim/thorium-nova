import App from "../app";
import Entity from "../helpers/ecs/entity";
import {FieldResolver, Query, Resolver, Root} from "type-graphql";
import {ShipAssetsComponent} from "server/components/shipAssets";

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
}
