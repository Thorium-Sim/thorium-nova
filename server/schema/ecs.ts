import ECS from "s/helpers/ecs/ecs";
import Entity from "s/helpers/ecs/entity";
import {Query, Resolver} from "type-graphql";

const ecs = new ECS();
@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return ecs.entities;
  }
}
