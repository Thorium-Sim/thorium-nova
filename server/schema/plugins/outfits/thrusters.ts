import {number} from "prop-types";
import App from "server/app";
import Components from "server/components";
import {Coordinates} from "server/components/Coordinates";
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
export class ThrustersOutfitResolver {
  @Query(returns => Entity, {name: "thrustersOutfit"})
  thrustersOutfitQuery(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    const {outfit} = getOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
    });
    return outfit;
  }
  @Mutation(returns => Entity)
  thrustersSetDirection(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("direction", type => Coordinates) direction: Coordinates
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {direction},
    });
  }
  @Mutation(returns => Entity)
  thrustersSetDirectionMaxSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed") speed: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {directionMaxSpeed: speed},
    });
  }
  @Mutation(returns => Entity)
  thrustersSetDirectionThrust(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("thrust") thrust: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {directionThrust: thrust},
    });
  }
  @Mutation(returns => Entity)
  thrustersSetRotationDelta(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("rotation", type => Coordinates) rotation: Coordinates
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {rotationDelta: rotation},
    });
  }
  @Mutation(returns => Entity)
  thrustersSetRotationMaxSpeed(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("speed") speed: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {rotationMaxSpeed: speed},
    });
  }
  @Mutation(returns => Entity)
  thrustersSetRotationThrust(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("thrust") thrust: number
  ) {
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "thrusters",
      update: {rotationThrust: thrust},
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
        outfitType: "thrusters",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "thrustersOutfit"];
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
  thrustersOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string
  ): Entity {
    return payload.outfit;
  }
}
