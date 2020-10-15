import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {
  Arg,
  Field,
  FieldResolver,
  ID,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {EntityTypes, getEntityType} from "../ecs";
import {calculateHabitableZone} from "server/schema/plugins/universe/systems";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";

@ObjectType()
export class ActivePlanetarySystem extends Entity {
  pluginId!: string;

  @Field(type => [Entity], {
    description: "The objects that inhabit this system",
  })
  items: Entity[] = [];

  constructor(params: Partial<ActivePlanetarySystem>) {
    super(params);
  }
}

@Resolver(of => ActivePlanetarySystem)
export class ActivePlanetarySystemResolver extends Entity {
  @FieldResolver(type => Number)
  habitableZoneInner(@Root() self: ActivePlanetarySystem) {
    const stars =
      App.activeFlight?.ecs.entities.filter(
        s => s.satellite?.parentId === self.id && s.isStar
      ) || [];
    const {min} = calculateHabitableZone(stars);
    return min;
  }

  @FieldResolver(type => Number)
  habitableZoneOuter(@Root() self: ActivePlanetarySystem) {
    const stars =
      App.activeFlight?.ecs.entities.filter(
        s => s.satellite?.parentId === self.id && s.isStar
      ) || [];
    const {max} = calculateHabitableZone(stars);
    return max;
  }

  @FieldResolver(type => [Entity])
  items(@Root() self: ActivePlanetarySystem) {
    return App.activeFlight?.ecs.entities.filter(
      s => s.satellite?.parentId === self.id
    );
  }
}

@Resolver()
export class UniverseResolver {
  @Query(type => [Entity])
  universeSystems(): Entity[] {
    return (
      App.activeFlight?.ecs.entities?.filter(
        e => getEntityType(e) === EntityTypes.system
      ) || []
    );
  }
  @Query(type => ActivePlanetarySystem, {
    name: "universeSystem",
    nullable: true,
  })
  universeSystemQuery(
    @Arg("systemId", type => ID) id: string
  ): ActivePlanetarySystem | null {
    const system = App.activeFlight?.ecs.entities.find(e => e.id === id);
    if (!system) return null;
    return new ActivePlanetarySystem(system);
  }
  @Subscription(returns => ActivePlanetarySystem, {
    topics: ({args, payload}) => {
      const id = uuid();
      const system = App.activeFlight?.ecs.entities.find(
        e => e.id === args.systemId
      );
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.systemId,
          system,
        });
      });
      return [id, "universeSystem"];
    },
    filter: ({args, payload}) => {
      if (args.systemId !== payload.id) return false;
      return true;
    },
  })
  universeSystem(
    @Root() payload: {id: string; system: Entity},
    @Arg("systemId", type => ID) id: string
  ): ActivePlanetarySystem {
    return new ActivePlanetarySystem(payload.system);
  }
}
