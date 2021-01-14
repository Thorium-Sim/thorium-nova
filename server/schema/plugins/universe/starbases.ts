import {Coordinates} from "server/components/Coordinates";
import {PositionComponent} from "server/components/position";
import ECS from "server/helpers/ecs/ecs";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {shipSpawn} from "server/schema/activeFlight/ships";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {getPlugin} from "../basePlugin";
import {getSystem, publishPluginUniverse} from "./utils";

@Resolver()
export class UniversePluginStarbasesResolver {
  @Mutation(returns => Entity)
  async pluginUniverseAddStarbase(
    @Arg("pluginId", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("position", type => Coordinates)
    position: Coordinates
  ) {
    const {plugin, system} = getSystem(id, systemId);

    const entities: Entity[] = [];
    const fauxEcs = {
      addEntity: (entity: Entity) => {
        entities.push(entity);
      },
    };
    const entity = shipSpawn(shipId, systemId, position, fauxEcs);
    entities.forEach(e => plugin.universe.push(e));
    publishPluginUniverse(plugin);
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
    return entity;
  }
  @Mutation(returns => Entity)
  async pluginUniverseStarbaseSetPosition(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string,
    @Arg("position", type => PositionComponent)
    position: PositionComponent
  ) {
    const plugin = getPlugin(pluginId);
    const starbase = plugin.universe.find(({id}) => id === shipId);
    if (!starbase) throw new Error("Cannot find starbase in plugin.");
    starbase.updateComponent("position", position);
    return starbase;
  }
}
