import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import StationComplement from "../stationComplement";
import {getPlugin} from "./basePlugin";

@Resolver()
export class StationComplementPluginResolver {
  @Query(returns => StationComplement, {
    nullable: true,
    name: "stationComplement",
  })
  stationComplementQuery(
    @Arg("id", type => ID)
    id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ): StationComplement | null {
    const plugin = getPlugin(pluginId);
    return plugin.stationComplements.find(s => s.id === id) || null;
  }
  @Query(returns => [StationComplement], {name: "stationComplements"})
  stationComplementsQuery(
    @Arg("pluginId", type => ID) pluginId: string
  ): StationComplement[] {
    const plugin = getPlugin(pluginId);
    return plugin.stationComplements || [];
  }
  @Mutation(returns => StationComplement)
  stationComplementCreate(
    @Arg("pluginId", type => ID) pluginId: string,

    @Arg("name") name: string
  ): StationComplement {
    const plugin = getPlugin(pluginId);
    if (plugin.stationComplements.find(s => s.name === name)) {
      throw new Error("A station complement with that name already exists.");
    }

    const stationComplement = new StationComplement({name});
    plugin.stationComplements.push(stationComplement);

    return stationComplement;
  }

  // @Mutation(returns => StationComplement)
  // stationComplementRename(
  //   @Arg("name") name: string,
  //   @Arg("id", type => ID) id: string,
  // ) {
  //   const stationComplement = App.plugins.stationComplements.find(s => s.id === id) || null;
  //   if (!stationComplement) throw new Error("Unable to find ship.");
  //  stationComplement.
  //   publishShip(ship);
  //   return ship;
  // }
}
