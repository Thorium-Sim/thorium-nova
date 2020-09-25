import Entity from "server/helpers/ecs/entity";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getShip, shipPublish} from "./utils";

@Resolver()
export class PluginShipPhysicalResolver {
  @Mutation()
  pluginShipSetMass(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("mass", {description: "Mass in kilograms"})
    mass: number
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("isShip", {
      mass,
    });
    shipPublish({plugin, ship});
    return ship;
  }
  @Mutation()
  pluginShipSetSize(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("size", {description: "Length in kilometers"})
    size: number
  ): Entity {
    const {plugin, ship} = getShip({pluginId, shipId});
    ship.updateComponent("size", {
      value: size,
    });
    shipPublish({plugin, ship});
    return ship;
  }
}
