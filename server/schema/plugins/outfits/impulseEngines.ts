import {number} from "prop-types";
import App from "server/app";
import Components from "server/components";
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

import {getOutfit, outfitPublish, updateOutfit} from "./utils";

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
    @Arg("speed", type => Number) speed: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "impulseEngines",
      update: {targetSpeed: speed},
    });
  }
  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const {outfit} = getOutfit({
        pluginId: args.pluginId,
        outfitId: args.outfitId,
        shipId: args.shipId,
        outfitType: "impulseEngines",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "impulseEnginesOutfit"];
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
  impulseEnginesOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    return payload.outfit;
  }
}
