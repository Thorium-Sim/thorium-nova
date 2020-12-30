import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {
  Arg,
  Ctx,
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
import {getPlugin} from "../plugins/basePlugin";
import {GraphQLContext} from "server/helpers/graphqlContext";

@ObjectType()
export class ActivePlanetarySystem extends Entity {
  pluginId!: string;

  @Field(type => [Entity], {
    description: "The objects that inhabit this system",
  })
  items: Entity[] = [];
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
  items(
    @Arg("shipId", {
      nullable: true,
      description:
        "If you want to get waypoints for a specific ship, you can set this variable.",
    })
    shipId: string,
    @Root() self: ActivePlanetarySystem,
    @Ctx() context: GraphQLContext
  ) {
    return App.activeFlight?.ecs.entities.filter(s => {
      return (
        s.satellite?.parentId === self.id ||
        (s.isWaypoint &&
          s.interstellarPosition?.systemId === self.id &&
          s.isWaypoint.assignedShipId === (shipId || context.client?.shipId))
      );
    });
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
  @Query(type => [Entity])
  pluginUniverseGetPersistentObjects(
    @Arg("pluginIds", type => [ID], {nullable: true}) pluginIds: string[] | null
  ): Entity[] {
    const validEntityTypes = [EntityTypes.ship, EntityTypes.planet];
    if (!pluginIds)
      return (
        App.activeFlight?.ecs.entities?.filter(e =>
          validEntityTypes.includes(getEntityType(e))
        ) || []
      );
    const entities = pluginIds.reduce((prev: Entity[], next) => {
      const plugin = getPlugin(next);

      return prev.concat(
        plugin.universe.filter(u => validEntityTypes.includes(getEntityType(u)))
      );
    }, []);
    return entities;
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
