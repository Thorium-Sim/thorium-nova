import {number} from "prop-types";
import App from "server/app";
import Components from "server/components";
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

import {getOutfit, updateOutfit} from "./utils";

@Resolver()
export class ImpulseEnginesOutfitResolver {
  @Query(returns => Entity, {name: "impulseEnginesOutfit"})
  impulseEnginesOutfitQuery(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    const {outfit} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "impulseEngines",
    });
    return outfit;
  }
  @Mutation(returns => Entity)
  impulseEnginesSetCruisingSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed", type => Number) speed: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "impulseEngines",
      update: {cruisingSpeed: speed},
    });
  }
  @Mutation(returns => Entity)
  impulseEnginesSetEmergencySpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed", type => Number) speed: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "impulseEngines",
      update: {emergencySpeed: speed},
    });
  }
  @Mutation(returns => Entity)
  impulseEnginesSetThrust(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("thrust", type => Number) thrust: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "impulseEngines",
      update: {thrust},
    });
  }
  @Mutation(returns => Entity)
  impulseEnginesSetTargetSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed", type => Number) speed: number,
    @Ctx() context: GraphQLContext
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId: shipId || context.client?.shipId || "",
      outfitType: "impulseEngines",
      update: {targetSpeed: speed},
    });
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
        outfitType: "impulseEngines",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "impulseEnginesOutfit"];
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
  impulseEnginesOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    return payload.outfit;
  }
}
