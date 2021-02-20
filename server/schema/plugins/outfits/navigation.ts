import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  Ctx,
  ID,
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
    @Arg("shipId", type => ID, {nullable: true}) shipIdArg: string,
    @Arg("destinationWaypointId", type => ID) destinationWaypointId: string,
    @Ctx() context: GraphQLContext
  ) {
    const shipId = shipIdArg || context.client?.shipId || "";
    // Update the autopilot for the crew's ship
    const ship = App.activeFlight?.ecs.entities.find(s => s.id === shipId);
    const waypoint = App.activeFlight?.ecs.entities.find(
      s => s.id === destinationWaypointId
    );
    if (ship && waypoint) {
      ship?.updateComponent("autopilot", {
        desiredCoordinates: waypoint.position,
        desiredInterstellarSystemId: waypoint.interstellarPosition?.systemId,
        rotationAutopilot: true,
        forwardAutopilot: false,
      });
    }
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
      update: {destinationWaypointId: destinationWaypointId, locked: true},
    });
  }
  @Mutation(returns => Entity)
  navigationUnlockDestination(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipIdArg: string,
    @Ctx() context: GraphQLContext
  ) {
    const shipId = shipIdArg || context.client?.shipId || "";
    // Deactivate the ship's autopilot
    const ship = App.activeFlight?.ecs.entities.find(
      s => s.id === (shipId || context.client?.shipId)
    );
    ship?.updateComponent("autopilot", {
      rotationAutopilot: false,
      forwardAutopilot: false,
    });
    // We need to clear out the current thruster adjustments
    const thrusters = App.activeFlight?.ecs.entities.find(
      t => t.thrusters && t.shipAssignment?.shipId === shipId
    );
    thrusters?.updateComponent("thrusters", {
      rotationDelta: {x: 0, y: 0, z: 0},
    });
    return updateOutfit({
      pluginId,
      outfitId,
      shipId,
      outfitType: "navigation",
      update: {locked: false, destinationWaypointId: null},
    });
  }
  @Mutation(returns => Entity)
  navigationSetThrustAutopilot(
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("isActive", type => Boolean) isActive: boolean,
    @Ctx() context: GraphQLContext
  ) {
    const ship = App.activeFlight?.ecs.entities.find(
      s => s.id === (shipId || context.client?.shipId)
    );
    if (!ship) throw new Error("Unable to find ship.");
    ship.updateComponent("autopilot", {
      forwardAutopilot: isActive,
    });
    // We specifically won't clear out the impulse and warp because
    // we want the ship to maintain its current speed.
    if (ship.isPlayerShip) {
      pubsub.publish("playerShip", {shipId: ship.id, ship});
    }
    return ship;
  }
  @Mutation(returns => Entity)
  navigationSetMaxDestinationRadius(
    @Arg("pluginId", type => ID, {nullable: true}) pluginId: string,
    @Arg("outfitId", type => ID, {nullable: true}) outfitId: string,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string,
    @Arg("maxDestinationRadius") maxDestinationRadius: number
  ) {
    // TODO: Make it so the navigation radius actually has an effect
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
    topics: ({
      args,
      context,
    }: {
      args: {
        pluginId: string | null;
        outfitId: string | null;
        shipId: string | null;
      };
      context: GraphQLContext;
    }) => {
      const id = uuid();
      const shipId = args.shipId || context.client?.shipId || undefined;
      const {outfit} = getOutfit({
        pluginId: args.pluginId || undefined,
        outfitId: args.outfitId || undefined,
        shipId,
        outfitType: "navigation",
      });

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId,
          pluginId: args.pluginId,
          outfitId: args.outfitId,
          outfit,
        });
      });
      return [id, "navigationOutfit"];
    },
    filter: ({
      args,
      payload,
      context,
    }: {
      args: {
        pluginId: string | null;
        outfitId: string | null;
        shipId: string | null;
      };
      payload: {
        shipId: string | null;
        pluginId: string | null;
        outfitId: string | null;
      };
      context: GraphQLContext;
    }) => {
      const shipId = args.shipId || context.client?.shipId;

      if (args.pluginId && args.outfitId) {
        return (
          payload.pluginId === args.pluginId &&
          payload.outfitId === args.outfitId
        );
      }
      if (shipId) {
        return payload.shipId === shipId;
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
