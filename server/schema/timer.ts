import App from "../app";
import {TimerComponent} from "../components/timer";
import Entity from "../helpers/ecs/entity";
import {pubsub} from "../helpers/pubsub";
import {
  Arg,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uniqid from "uniqid";

interface TimersPayload {
  entities: Entity[];
}

@Resolver(Entity)
export class TimerResolver {
  @Query(returns => [Entity], {name: "timers"})
  timersQuery() {
    return App.activeFlight?.ecs.entities.filter(e => e.components.timer);
  }
  @Query(returns => Entity, {name: "timer"})
  timerQuery(
    @Arg("id", type => ID, {nullable: true}) id: string
  ): Entity | null {
    return (
      App.activeFlight?.ecs.entities.find(
        e => e.components.timer && e.id === id
      ) || null
    );
  }
  @Mutation(returns => Entity)
  timerCreate(
    @Arg("label")
    label: string,
    @Arg("time")
    time: string
  ): Entity {
    const entity = new Entity(null, [TimerComponent]);
    App.activeFlight?.ecs.addEntity(entity);
    entity.updateComponent("timer", {label, time});

    pubsub.publish("timers", {
      entities: App.activeFlight?.ecs.entities.filter(e => e.components.timer),
    });

    return entity;
  }
  @Mutation(returns => Entity, {nullable: true})
  timerPause(
    @Arg("id", type => ID)
    id: string,
    @Arg("pause")
    pause: boolean
  ): Entity | undefined {
    const entity = App.activeFlight?.ecs.entities.find(e => e.id === id);

    /* istanbul ignore else */
    if (entity?.components.timer) {
      entity.components.timer.paused = pause;
    }

    pubsub.publish("timers", {
      entities: App.activeFlight?.ecs.entities.filter(e => e.components.timer),
    });

    return entity;
  }
  @Mutation(returns => String)
  timerRemove(
    @Arg("id", type => ID)
    id: string
  ): string | undefined {
    App.activeFlight?.ecs.removeEntityById(id);
    pubsub.publish("timers", {
      entities: App.activeFlight?.ecs.entities.filter(e => e.components.timer),
    });

    return "";
  }

  /* istanbul ignore next */
  @Subscription(returns => [Entity], {
    topics: ({args, payload, context}) => {
      const id = uniqid();
      process.nextTick(() => {
        pubsub.publish(id, {
          entities: App.activeFlight?.ecs.entities.filter(
            e => e.components.timer
          ),
        });
      });
      return [id, "timers"];
    },
    nullable: true,
  })
  timer(
    @Root() payload: TimersPayload,
    @Arg("id", type => ID) id: string
  ): Entity | null {
    return payload?.entities.find(e => e.id === id) || null;
  }

  /* istanbul ignore next */
  @Subscription(returns => [Entity], {
    topics: ({args, payload, context}) => {
      const id = uniqid();
      process.nextTick(() => {
        pubsub.publish(id, {
          entities: App.activeFlight?.ecs.entities.filter(
            e => e.components.timer
          ),
        });
      });
      return [id, "timers"];
    },
  })
  timers(@Root() payload: TimersPayload): Entity[] {
    return payload?.entities || [];
  }
}
