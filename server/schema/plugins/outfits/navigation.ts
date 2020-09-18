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

import {getOutfit, updateOutfit} from "./utils";

@Resolver()
export class NavigationOutfitResolver {
  @Query(returns => Entity, {name: "navigationOutfit"})
  navigationOutfitQuery(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    const {outfit} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
    });
    return outfit;
  }
  @Mutation(returns => Entity)
  navigationSetDestination(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("destination", type => ID) destination: string
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
      update: {destinationId: destination},
    });
  }
  @Mutation(returns => Entity)
  navigationSetLocked(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("locked", type => Boolean) locked: boolean
  ) {
    // TODO: Add more nuance around whether the destination can be locked
    // based on the current trajectory of the ship.
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
      update: {locked},
    });
  }
  @Mutation(returns => Entity)
  navigationSetMaxDestinationRadius(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("maxDestinationRadius") maxDestinationRadius: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
      update: {maxDestinationRadius},
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
        outfitType: "navigation",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "navigationOutfit"];
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
  navigationOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    return payload.outfit;
  }
}
