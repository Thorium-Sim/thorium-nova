import App from "../../app";
import {Arg, ID, Mutation, Query, Resolver} from "type-graphql";
import StationComplement from "../stationComplement";
import getStore from "../../helpers/dataStore";
import {appStoreDir} from "../../helpers/appPaths";

@Resolver()
export class StationComplementPluginResolver {
  @Query(returns => StationComplement, {
    nullable: true,
    name: "stationComplement",
  })
  stationComplementQuery(
    @Arg("id", type => ID) id: string
  ): StationComplement | null {
    return App.plugins.stationComplements.find(s => s.id === id) || null;
  }
  @Query(returns => [StationComplement], {name: "stationComplements"})
  stationComplementsQuery(): StationComplement[] {
    return App.plugins.stationComplements || [];
  }
  @Mutation(returns => StationComplement)
  stationComplementCreate(
    @Arg("name")
    name: string
  ): StationComplement {
    if (App.plugins.stationComplements.find(s => s.name === name)) {
      throw new Error("A station complement with that name already exists.");
    }
    const stationComplement = getStore<StationComplement>({
      class: StationComplement,
      path: `${appStoreDir}stationComplements/${name}/data.json`,
      initialData: new StationComplement({name}),
    });

    App.plugins.stationComplements.push(stationComplement);

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
