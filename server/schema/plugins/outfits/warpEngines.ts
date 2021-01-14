import {number} from "prop-types";
import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  Ctx,
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
    @Arg("factor", type => Int) factor: number,
    @Ctx() context: GraphQLContext
  ) {
    const {outfit, ship, plugin} = getOutfit({
      pluginId,
      outfitId,
      shipId: shipId || context.client?.shipId || "",
      outfitType: "warpEngines",
    });
    if (!outfit) throw new Error("Unable to find outfit.");
    if (!outfit.warpEngines)
      throw new Error("Outfit is not a warp engines outfit");
    if (!ship) throw new Error("Outfit is not assigned to a ship.");
    const {
      interstellarCruisingSpeed,
      planetaryCruisingSpeed,
      minSpeedMultiplier,
      warpFactorCount,
    } = outfit.warpEngines;

    const cruisingSpeed =
      ship.interstellarPosition?.systemId === null
        ? interstellarCruisingSpeed
        : planetaryCruisingSpeed;

    const minWarp = cruisingSpeed * minSpeedMultiplier;

    // Calculate max warp speed based on the factor and the number of warp factors
    let warpSpeed = 0;
    if (factor === 1) {
      warpSpeed = minWarp;
    } else if (factor > 1) {
      warpSpeed =
        (cruisingSpeed - minWarp) * ((factor - 1) / (warpFactorCount - 1));
    }

    outfit.updateComponent("warpEngines", {
      currentWarpFactor: factor,
      maxVelocity: warpSpeed,
    });
    outfitPublish({plugin, ship, outfit});
    return outfit;
  }
  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({
      args,
      payload,
      context,
    }: {
      args: {pluginId?: string; outfitId?: string; shipId?: string};
      payload: {pluginId?: string; outfitId?: string; shipId?: string};
      context: GraphQLContext;
    }) => {
      const id = uuid();
      const shipId = args.shipId || context.client?.shipId || "";

      const {outfit} = getOutfit({
        pluginId: args.pluginId,
        outfitId: args.outfitId,
        shipId,
        outfitType: "warpEngines",
      });
      setTimeout(() => {
        pubsub.publish(id, {
          shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      }, 100);
      return [id, "warpEnginesOutfit"];
    },
    filter: ({
      args,
      payload,
      context,
    }: {
      args: {pluginId?: string; outfitId?: string; shipId?: string};
      payload: {pluginId?: string; outfitId?: string; shipId?: string};
      context: GraphQLContext;
    }) => {
      if (args.pluginId && args.outfitId) {
        return (
          payload.pluginId === args.pluginId &&
          payload.outfitId === args.outfitId
        );
      }
      if (args.shipId || context.client?.shipId) {
        return (
          payload.shipId === args.shipId ||
          payload.shipId === context.client?.shipId
        );
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
