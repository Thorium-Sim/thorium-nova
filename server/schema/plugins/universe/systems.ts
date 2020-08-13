import {IdentityComponent} from "server/components/identity";
import {PlanetarySystemComponent} from "server/components/planetarySystem";
import {PositionComponent} from "server/components/position";
import {TagsComponent} from "server/components/tags";
import systemNames from "server/generatorFixtures/systemNames";
import Entity from "server/helpers/ecs/entity";
import {randomFromList} from "server/helpers/randomFromList";
import UniverseTemplate from "server/schema/universe";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getUniverse, publish} from "./utils";

@Resolver()
export class UniversePluginSystemsResolver {
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
    @Arg("starId", type => ID) starId: string
  ) {
    const time = Date.now();
    const universe = getUniverse(id);
    universe.entities = universe.entities.filter(e => e.id !== starId);
    publish(universe);
    return "";
  }

  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("starId", type => ID)
    starId: string,
    @Arg("name", type => String)
    name: string
  ) {
    const universe = getUniverse(id);
    const star = universe.entities.find(s => s.id === starId);
    if (!star) throw new Error("Star does not exist.");
    star.updateComponent("identity", {name});
    publish(universe);
    return universe;
  }
  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("starId", type => ID)
    starId: string,
    @Arg("description", type => String)
    description: string
  ) {
    const universe = getUniverse(id);
    const star = universe.entities.find(s => s.id === starId);
    if (!star) throw new Error("Star does not exist.");
    star.updateComponent("identity", {description});
    publish(universe);

    return universe;
  }

  @Mutation(returns => UniverseTemplate)
  async universeTemplateSystemSetPosition(
    @Arg("id", type => ID)
    id: string,
    @Arg("starId", type => ID)
    starId: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const universe = getUniverse(id);
    const star = universe.entities.find(s => s.id === starId);
    if (!star) throw new Error("Star does not exist.");
    star.updateComponent("position", position);
    return universe;
  }
}
