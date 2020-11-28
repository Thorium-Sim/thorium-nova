import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {Arg, Ctx, Mutation, Resolver, Root, Subscription} from "type-graphql";
import {shipPublish} from "../plugins/ship/utils";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";

@Resolver()
export class AlertLevelResolver {
  @Mutation(returns => Entity, {nullable: true})
  shipSetAlertLevel(
    @Arg("shipId", type => String, {nullable: true})
    shipId: string | null,
    @Arg("alertLevel", type => String)
    alertLevel: "1" | "2" | "3" | "4" | "5" | "p",
    @Ctx()
    context: GraphQLContext
  ): Entity | null {
    const ship = App.activeFlight?.ecs.entities.find(
      s => s.id === (shipId || context.ship?.id)
    );
    if (!ship) return null;
    ship.updateComponent("alertLevel", {alertLevel});
    shipPublish({ship});

    return ship;
  }
  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({context}: {context: GraphQLContext}) => {
      const id = uuid();
      const ship = context.ship;
      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: ship?.id,
          ship,
        });
      });
      return [id, "shipAlertLevel"];
    },
    filter: ({
      payload,
      context,
    }: {
      payload: {shipId?: string; ship?: Entity};
      context: GraphQLContext;
    }) => {
      if (context.ship?.id !== payload.shipId) return false;
      return true;
    },
    description:
      "Only provides subscription update when the player ship alert level changes.",
  })
  shipAlertLevel(
    @Root() payload: {shipId?: string; ship?: Entity},
    @Ctx()
    context: GraphQLContext
  ): Entity | null {
    if (payload.ship) return payload.ship;
    return null;
  }
}
