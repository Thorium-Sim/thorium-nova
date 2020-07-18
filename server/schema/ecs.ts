import ecs from "s/helpers/ecs/ecs";
import Entity, {TimerComponent} from "s/helpers/ecs/entity";
import {Arg, Mutation, Query, Resolver} from "type-graphql";

@Resolver(Entity)
export class EntityResolver {
  @Query(returns => [Entity])
  async entities() {
    return ecs.entities;
  }

  @Mutation(returns => Entity)
  timerCreate(
    @Arg("label")
    label: string,
    @Arg("time")
    time: string,
  ): Entity {
    const entity = new Entity(null, [TimerComponent]);
    ecs.addEntity(entity);
    console.log(entity);
    return entity;
  }
}
console.log(new Entity(null, []));
