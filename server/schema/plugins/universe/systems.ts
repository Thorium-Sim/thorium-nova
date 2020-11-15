import {IdentityComponent} from "server/components/identity";
import {PlanetarySystemComponent} from "server/components/planetarySystem";
import {PositionComponent} from "server/components/position";
import {TagsComponent} from "server/components/tags";
import systemNames from "server/generatorFixtures/systemNames";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {randomFromList} from "server/helpers/randomFromList";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {AU, getSystem, getPlugin, PlanetarySystem, publish} from "./utils";
import uuid from "uniqid";
import getHabitableZone from "server/generatorFixtures/habitableZone";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {SatelliteComponent} from "server/components/satellite";
import App from "server/app";

@Resolver()
export class UniversePluginSystemsResolver {
  @Query(returns => PlanetarySystem, {name: "pluginUniverseSystem"})
  pluginUniverseSystemQuery(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Ctx()
    context: GraphQLContext
  ) {
    const plugin = getPlugin(id);
    const system = plugin.universe.find(s => s.id === systemId);
    if (!system) {
      throw new Error("System does not exist");
    }
    context.pluginId = plugin.id;
    return new PlanetarySystem({...system, pluginId: plugin.id});
  }
  @Mutation(returns => Entity)
  async pluginUniverseAddSystem(
    @Arg("id", type => ID)
    id: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const plugin = getPlugin(id);
    const starNames = plugin.universe
      .filter(s => s.isStar)
      .map(s => s.identity?.name);
    const availableNames = systemNames.filter(val => !starNames.includes(val));

    const name = randomFromList(availableNames) || "Bob"; // If this happens, I'll laugh very hard.
    const entity = new Entity(null, [
      PositionComponent,
      TagsComponent,
      IdentityComponent,
      PlanetarySystemComponent,
    ]);
    entity.updateComponent("identity", {name});
    entity.updateComponent("position", position);
    plugin.universe.push(entity);
    publish(plugin);
    return entity;
  }

  @Mutation(returns => PlanetarySystem)
  async pluginUniverseSystemSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("name", type => String)
    name: string
  ) {
    const {plugin, system} = getSystem(id, systemId);

    const oldName = system.components.identity?.name || "";
    system.updateComponent("identity", {name});

    // Update all of the stars in the system to match the new name
    const stars = plugin.universe.filter(
      s =>
        s.components.satellite?.parentId === systemId &&
        s.components.identity?.name.includes(oldName)
    );
    stars.forEach(star => {
      star.updateComponent("identity", {
        name: star.components.identity?.name.replace(oldName, name),
      });
    });
    publish(plugin);
    return system;
  }
  @Mutation(returns => PlanetarySystem)
  async pluginUniverseSystemSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("description", type => String)
    description: string
  ) {
    const {plugin, system} = getSystem(id, systemId);

    system.updateComponent("identity", {description});
    publish(plugin);

    return system;
  }
  @Mutation(returns => PlanetarySystem)
  async pluginUniverseSystemSetSkyboxKey(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("skyboxKey", type => String)
    skyboxKey: string
  ) {
    const {plugin, system} = getSystem(id, systemId);
    system.updateComponent("planetarySystem", {skyboxKey});
    publish(plugin);
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});

    return system;
  }

  @Mutation(returns => PlanetarySystem)
  async pluginUniverseSystemSetPosition(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const {plugin, system} = getSystem(id, systemId);

    system.updateComponent("position", position);
    return system;
  }

  @Subscription(returns => PlanetarySystem, {
    topics: ({args: {id, systemId}, payload}) => {
      const subId = uuid();
      process.nextTick(() => {
        const plugin = getPlugin(id);
        const system = plugin.universe.find(s => s.id === systemId);
        pubsub.publish(subId, {
          id: system?.id,
          system: {...system, pluginId: plugin.id},
        });
      });
      return [subId, "pluginUniverseSystem"];
    },
    filter: ({payload, args: {id, systemId}}) => {
      return payload.id === systemId;
    },
  })
  pluginUniverseSystem(
    @Root() payload: {system: PlanetarySystem},
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Ctx()
    context: GraphQLContext
  ): PlanetarySystem {
    context.pluginId = payload.system.pluginId;
    return new PlanetarySystem(payload.system);
  }
}

type range = {min: number; max: number};
export function calculateHabitableZone(stars: Entity[]) {
  // Just less than the orbit of Neptune 🥶 in KM
  const maxPlanetDistance = 4000000000;

  // 1/5 the orbit of Mercury 🥵 in KM
  const minPlanetDistance = 10000000;

  // We'll use the habitable zone radius of the largest star
  const biggestStar = stars.reduce((prev: Entity | null, next) => {
    if (!prev || !prev.isStar) return next;
    if (!next.isStar) return prev;
    if (next.isStar.radius > prev.isStar.radius) return next;
    return prev;
  }, null);
  if (!biggestStar?.isStar || !biggestStar.temperature)
    return {min: minPlanetDistance, max: maxPlanetDistance};
  const habitableZone = getHabitableZone(
    biggestStar.isStar?.radius,
    biggestStar.temperature?.temperature
  );
  return {
    min: Math.max(habitableZone.min * AU, minPlanetDistance),
    max: Math.min(habitableZone.max * AU, maxPlanetDistance),
  };
}
@Resolver(of => PlanetarySystem)
export class PlanetarySystemResolver {
  @FieldResolver(type => Number, {
    description: "The inner radius of the habitable zone in kilometers",
  })
  habitableZoneInner(@Root() self: PlanetarySystem) {
    const plugin = getPlugin(self.pluginId);
    const stars = plugin.universe.filter(
      s => s.satellite?.parentId === self.id && s.isStar
    );
    const {min} = calculateHabitableZone(stars);
    return min;
  }

  @FieldResolver(type => Number, {
    description: "The outer radius of the habitable zone in kilometers",
  })
  habitableZoneOuter(@Root() self: PlanetarySystem) {
    const plugin = getPlugin(self.pluginId);

    const stars = plugin.universe.filter(
      s => s.satellite?.parentId === self.id && s.isStar
    );
    const {max} = calculateHabitableZone(stars);
    return max;
  }

  @FieldResolver(type => [Entity])
  items(@Root() self: PlanetarySystem) {
    const plugin = getPlugin(self.pluginId);
    return plugin.universe.filter(s => s.satellite?.parentId === self.id);
  }
}

@Resolver(of => SatelliteComponent)
export class SatelliteComponentResolver {
  @FieldResolver(type => [Entity], {nullable: true})
  satellites(
    @Root() self: SatelliteComponent & {entity: Entity},
    @Ctx() ctx: GraphQLContext
  ) {
    let universeObjects: Entity[] = [];
    if (ctx.pluginId) {
      const plugin = getPlugin(ctx.pluginId);
      universeObjects = plugin.universe;
    }
    if (universeObjects.length === 0) {
      universeObjects = App.activeFlight?.ecs.entities || [];
    }
    return universeObjects.filter(
      e => e.satellite?.parentId === self.entity.id
    );
  }
  @FieldResolver(type => Entity, {nullable: true})
  parent(@Root() self: SatelliteComponent, @Ctx() ctx: GraphQLContext) {
    let universeObjects: Entity[] = [];
    if (ctx.pluginId) {
      const plugin = getPlugin(ctx.pluginId);
      universeObjects = plugin.universe;
    }
    if (universeObjects.length === 0) {
      universeObjects = App.activeFlight?.ecs.entities || [];
    }
    return universeObjects.find(e => e.id === self.parentId) || null;
  }
}
