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
  Field,
  FieldResolver,
  ID,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {getUniverse, PlanetarySystem, publish} from "./utils";
import uuid from "uniqid";

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

  @Mutation(returns => String)
  universeTemplateRemoveSystem(
    @Arg("id", type => ID) id: string,
    @Arg("systemId", type => ID) systemId: string
  ) {
    const time = Date.now();
    const universe = getUniverse(id);
    universe.entities = universe.entities.filter(e => {
      if (e.id === systemId) {
        return false;
      }
      // Remove all of the objects in the system
      if (e.satellite?.parentId === systemId) return false;
      return true;
    });
    publish(universe);

    return "";
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
    const universe = getUniverse(id);
    const system = universe.entities.find(s => s.id === systemId);
    if (!system) throw new Error("System does not exist.");
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
    const universe = getUniverse(id);
    const system = universe.entities.find(s => s.id === systemId);
    if (!system) throw new Error("System does not exist.");
    system.updateComponent("identity", {description});
    publish(universe);

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
    const universe = getUniverse(id);
    const system = universe.entities.find(s => s.id === systemId);
    if (!system) throw new Error("System does not exist.");
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

@Resolver(of => PlanetarySystem)
export class PlanetarySystemResolver {
  @FieldResolver(type => [Entity])
  items(@Root() self: PlanetarySystem) {
    const universe = getUniverse(self.universeId);
    return universe.entities.filter(s => s.satellite?.parentId === self.id);
  }
}
