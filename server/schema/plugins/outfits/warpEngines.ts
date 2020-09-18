import {number} from "prop-types";
import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";

import {getOutfit, outfitPublish} from "./utils";

@Resolver()
export class WarpEngineOutfitResolver {
  @Query(returns => Entity, {name: "warpEnginesOutfit"})
  warpEnginesOutfitQuery(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    const {outfit} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    return outfit;
  }
  @Mutation(returns => Entity)
  warpEngineSetInterstellarCruisingSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed", type => Number) speed: number
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    outfit.updateComponent("warpEngines", {interstellarCruisingSpeed: speed});
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Mutation(returns => Entity)
  warpEngineSetPlanetaryCruisingSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed", type => Number) speed: number
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    outfit.updateComponent("warpEngines", {planetaryCruisingSpeed: speed});
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Mutation(returns => Entity)
  warpEngineSetMinSpeedMultiplier(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("multiplier", type => Number) multiplier: number
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    outfit.updateComponent("warpEngines", {minSpeedMultiplier: multiplier});
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Mutation(returns => Entity)
  warpEngineSetWarpFactorCount(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("count", type => Int) count: number
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    outfit.updateComponent("warpEngines", {warpFactorCount: count});
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Mutation(returns => Entity)
  warpEngineSetCurrentWarpFactor(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("factor", type => Int) factor: number
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "warpEngines",
    });
    outfit.updateComponent("warpEngines", {currentWarpFactor: factor});
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const {outfit} = getOutfit({
        pluginId: args.pluginId,
        outfitId: args.outfitId,
        shipId: args.shipId,
        outfitType: "warpEngines",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "warpEnginesOutfit"];
    },
    filter: ({args, payload}) => {
      if (args.pluginId && args.outfitId) {
        return (
          payload.pluginId === args.pluginId &&
          payload.outfitId === args.outfitId
        );
      }
      if (args.shipId) {
        return payload.shipId === args.shipId;
      }
      return false;
    },
  })
  warpEnginesOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    return payload.outfit;
  }
}
