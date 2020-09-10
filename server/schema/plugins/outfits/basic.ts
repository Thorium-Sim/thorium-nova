import Entity from "server/helpers/ecs/entity";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getPlugin} from "../basePlugin";
import {getOutfit, outfitPublish} from "./utils";

@Resolver()
export class PluginOutfitBasicResolver {
  @Mutation()
  pluginOutfitSetName(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("outfitId", type => ID)
    outfitId: string,
    @Arg("name", type => String)
    name: string
  ): Entity {
    const {plugin, outfit} = getOutfit(pluginId, outfitId);
    outfit.updateComponent("identity", {name});
    outfitPublish({plugin, outfit});
    return outfit;
  }
  @Mutation()
  pluginOutfitSetDescription(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("outfitId", type => ID)
    outfitId: string,
    @Arg("description", type => String)
    description: string
  ): Entity {
    const {plugin, outfit} = getOutfit(pluginId, outfitId);
    outfit.updateComponent("identity", {description});
    outfitPublish({plugin, outfit});
    return outfit;
  }
  @Mutation()
  pluginOutfitSetTags(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("outfitId", type => ID)
    outfitId: string,
    @Arg("tags", type => [String])
    tags: string[]
  ): Entity {
    const {plugin, outfit} = getOutfit(pluginId, outfitId);
    outfit.updateComponent("tags", {tags});
    outfitPublish({plugin, outfit});
    return outfit;
  }
}
