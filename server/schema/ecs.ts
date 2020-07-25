import App from "../app";
import Entity from "../helpers/ecs/entity";
import {Query, Resolver} from "type-graphql";

@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return App.activeFlight?.ecs.entities;
  }
}
