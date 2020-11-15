import {Arg, Ctx, ID, Query, Resolver, Root, Subscription} from "type-graphql";
import {getPlugin} from "./utils";
import Entity from "server/helpers/ecs/entity";
import {matchSorter} from "match-sorter";
import {GraphQLContext} from "server/helpers/graphqlContext";
import BasePlugin from "../basePlugin";
import uuid from "uniqid";
import App from "server/app";
import {pubsub} from "server/helpers/pubsub";
import {EntityTypes, getEntityType} from "server/schema/ecs";

@Resolver()
export class UniversePluginResolver {
  @Query(returns => [Entity])
  pluginUniverseSearch(
    @Arg("id", type => ID) id: string,
    @Arg("search", type => String) search: string,
    @Ctx() ctx: GraphQLContext
  ) {
    const plugin = getPlugin(id);
    ctx.pluginId = id;
    const matchItems = matchSorter(
      plugin.universe
        .filter(e => e.isStar || e.isPlanet || e.planetarySystem)
        .map(m => ({
          ...m,
          name: m.identity?.name,
          description: m.identity?.description,
          temperature: m.temperature?.temperature,
          spectralType: m.isStar?.spectralType,
          classification: m.isPlanet?.classification,
          mass: m.isStar?.solarMass || m.isPlanet?.terranMass,
          population: m.population?.count,
        })),
      search,
      {
        keys: [
          "name",
          "description",
          "temperature",
          "spectralType",
          "classification",
          "mass",
          "population",
        ],
      }
    ).map(m => m.id);

    return plugin.universe.filter(e => matchItems.includes(e.id));
  }
  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = App.plugins.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          universe: plugin?.universe,
        });
      });
      return [id, "pluginUniverse"];
    },
    filter: ({args, payload}) => {
      if (args.id !== payload.id) return false;
      const filteredPayload = payload.universe?.filter(
        (e: Entity) => getEntityType(e) === args.entityType
      );
      if (filteredPayload.length === 0) return false;
      return true;
    },
  })
  pluginUniverse(
    @Root() payload: {id: string; universe: Entity[]},
    @Arg("id", type => ID) id: string,
    @Arg("entityType", type => EntityTypes, {nullable: true}) entityType: string
  ): Entity[] {
    if (!entityType) return payload.universe;
    return payload.universe?.filter(e => getEntityType(e) === entityType) || [];
  }
}
