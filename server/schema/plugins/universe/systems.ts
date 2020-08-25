import {IdentityComponent} from "server/components/identity";
import {PlanetarySystemComponent} from "server/components/planetarySystem";
import {PositionComponent} from "server/components/position";
import {TagsComponent} from "server/components/tags";
import systemNames from "server/generatorFixtures/systemNames";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {randomFromList} from "server/helpers/randomFromList";
import UniverseTemplate from "server/schema/universe";
import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {
  AU,
  getSystem,
  getUniverse,
  PlanetarySystem,
  publish,
  removeUniverseObject,
} from "./utils";
import uuid from "uniqid";
import getHabitableZone from "server/generatorFixtures/habitableZone";

@Resolver()
export class UniversePluginSystemsResolver {
  @Query(returns => PlanetarySystem, {name: "templateUniverseSystem"})
  templateUniverseSystemQuery(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string
  ) {
    const universe = getUniverse(id);
    const system = universe.entities.find(s => s.id === systemId);
    if (!system) {
      throw new Error("System does not exist");
    }
    return new PlanetarySystem({...system, universeId: universe.id});
  }
  @Mutation(returns => Entity)
  async universeTemplateAddSystem(
    @Arg("id", type => ID)
    id: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const universe = getUniverse(id);
    const starNames = universe.entities
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
    universe.entities.push(entity);
    publish(universe);
    return entity;
  }

  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("name", type => String)
    name: string
  ) {
    const {universe, system} = getSystem(id, systemId);

    const oldName = system.components.identity?.name || "";
    system.updateComponent("identity", {name});

    // Update all of the stars in the system to match the new name
    const stars = universe.entities.filter(
      s =>
        s.components.satellite?.parentId === systemId &&
        s.components.identity?.name.includes(oldName)
    );
    stars.forEach(star => {
      star.updateComponent("identity", {
        name: star.components.identity?.name.replace(oldName, name),
      });
    });
    publish(universe);
    return universe;
  }
  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("description", type => String)
    description: string
  ) {
    const {universe, system} = getSystem(id, systemId);

    system.updateComponent("identity", {description});
    publish(universe);

    return universe;
  }
  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetSkyboxKey(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("skyboxKey", type => String)
    skyboxKey: string
  ) {
    const {universe, system} = getSystem(id, systemId);
    system.updateComponent("planetarySystem", {skyboxKey});
    publish(universe);
    pubsub.publish("templateUniverseSystem", {id: system.id, system});

    return universe;
  }

  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetPosition(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const {universe, system} = getSystem(id, systemId);

    system.updateComponent("position", position);
    return universe;
  }

  @Subscription(returns => PlanetarySystem, {
    topics: ({args: {id, systemId}, payload}) => {
      const subId = uuid();
      process.nextTick(() => {
        const universe = getUniverse(id);
        const system = universe.entities.find(s => s.id === systemId);
        pubsub.publish(subId, {
          id: system?.id,
          system: {...system, universeId: universe.id},
        });
      });
      return [subId, "templateUniverseSystem"];
    },
    filter: ({payload, args: {id, systemId}}) => {
      return payload.id === systemId;
    },
  })
  templateUniverseSystem(
    @Root() payload: {system: PlanetarySystem},
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string
  ): PlanetarySystem {
    return new PlanetarySystem(payload.system);
  }
}

type range = {min: number; max: number};
function calculateHabitableZone(stars: Entity[]) {
  // Just less than the orbit of Neptune 🥶
  const maxPlanetDistance = 4000000000;

  // 1/5 the orbit of Mercury 🥵
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
  @FieldResolver(type => Number)
  habitableZoneInner(@Root() self: PlanetarySystem) {
    const universe = getUniverse(self.universeId);
    const stars = universe.entities.filter(
      s => s.satellite?.parentId === self.id && s.isStar
    );
    const {min} = calculateHabitableZone(stars);
    return min;
  }

  @FieldResolver(type => Number)
  habitableZoneOuter(@Root() self: PlanetarySystem) {
    const universe = getUniverse(self.universeId);

    const stars = universe.entities.filter(
      s => s.satellite?.parentId === self.id && s.isStar
    );
    const {max} = calculateHabitableZone(stars);
    return max;
  }

  @FieldResolver(type => [Entity])
  items(@Root() self: PlanetarySystem) {
    const universe = getUniverse(self.universeId);
    return universe.entities.filter(s => s.satellite?.parentId === self.id);
  }
}
