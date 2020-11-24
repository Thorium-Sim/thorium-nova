import {StationComplementComponent} from "server/components/stationComplement";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import {getPlugin} from "./basePlugin";

@Resolver()
export class StationComplementPluginResolver {
  @Query(returns => StationComplementComponent, {
    nullable: true,
    name: "stationComplement",
  })
  stationComplementQuery(
    @Arg("id", type => ID)
    id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ): StationComplementComponent | null {
    const plugin = getPlugin(pluginId);
    return plugin.stationComplements.find(s => s.id === id) || null;
  }
  @Query(returns => [StationComplementComponent], {name: "stationComplements"})
  stationComplementsQuery(
    @Arg("pluginId", type => ID) pluginId: string
  ): StationComplementComponent[] {
    const plugin = getPlugin(pluginId);
    return plugin.stationComplements || [];
  }
  @Mutation(returns => StationComplementComponent)
  stationComplementCreate(
    @Arg("pluginId", type => ID) pluginId: string,

    @Arg("name") name: string
  ): StationComplementComponent {
    const plugin = getPlugin(pluginId);
    if (plugin.stationComplements.find(s => s.name === name)) {
      throw new Error("A station complement with that name already exists.");
    }

    const stationComplement = new StationComplementComponent({name});
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
