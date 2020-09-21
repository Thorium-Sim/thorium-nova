import Entity from "server/helpers/ecs/entity";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getPlugin} from "../basePlugin";
import {getShip, shipPublish} from "./utils";

@Resolver()
export class PluginShipBasicResolver {
  @Mutation()
  pluginShipSetName(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("name", type => String)
    name: string
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("identity", {name});
    shipPublish({plugin, ship});
    return ship;
  }
  @Mutation()
  pluginShipSetDescription(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("description", type => String)
    description: string
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("identity", {description});
    shipPublish({plugin, ship});
    return ship;
  }
  @Mutation()
  pluginShipSetTags(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("tags", type => [String])
    tags: string[]
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("tags", {tags});
    shipPublish({plugin, ship});
    return ship;
  }
}
