import {Arg, Ctx, ID, Query, Resolver} from "type-graphql";
import {getPlugin} from "./utils";
import Entity from "server/helpers/ecs/entity";
import matchSorter from "match-sorter";
import {GraphQLContext} from "server/helpers/graphqlContext";

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
}
