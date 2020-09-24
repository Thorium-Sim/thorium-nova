import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getAnyOutfit} from "../outfits/utils";
import {getShip, shipPublish} from "./utils";

@Resolver()
export class PluginShipOutfitResolver {
  @Mutation()
  pluginShipAddOutfit(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("outfitId", type => ID)
    outfitId: string
  ): Entity {
    const outfit = getAnyOutfit(outfitId);
    if (!outfit) {
      throw new Error("Outfit does not exist.");
    }
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("shipOutfits", {
      outfitIds: ship.shipOutfits?.outfitIds.concat(outfitId) || [outfitId],
    });
    shipPublish({plugin, ship});
    return ship;
  }
  @Mutation()
  pluginShipRemoveOutfit(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("outfitId", type => ID)
    outfitId: string
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("shipOutfits", {
      outfitIds: ship.shipOutfits?.outfitIds.filter(o => o !== outfitId) || [],
    });
    shipPublish({plugin, ship});
    return ship;
  }
}
