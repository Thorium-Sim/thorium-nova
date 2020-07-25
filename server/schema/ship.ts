import App from "../app";
import {AlertLevelT} from "../components/alertLevel";
import Entity from "../helpers/ecs/entity";
import {GraphQLContext} from "../helpers/graphqlContext";
import {pubsub} from "../helpers/pubsub";
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
import uniqid from "uniqid";

interface ShipPayload {
  ship: Entity;
}
interface ShipsPayload {
  entities: Entity[];
}

function getShip(context: GraphQLContext, id?: string) {
  const shipId = id || context.ship?.id;
  if (!shipId) throw new Error("ID is a required parameter");
  const ship = App.activeFlight?.ships.find(s => s.id === shipId);
  if (!ship) throw new Error("Unable to find ship.");
  return ship;
}

function publishShip(ship: Entity) {
  pubsub.publish("ship", {shipId: ship.id, ship});
  pubsub.publish("ships", {
    entities: App.activeFlight?.ships,
  });
}

@Resolver()
export class ShipResolver {
  @Query(returns => Entity, {nullable: true, name: "ship"})
  shipQuery(
    @Ctx() context: GraphQLContext,
    @Arg("id", {nullable: true}) id?: string,
  ): Entity | null {
    return (
      App.activeFlight?.ships.find(
        s => s.id === id || s.id === context.ship?.id,
      ) || null
    );
  }

  @Query(returns => [Entity], {name: "ships"})
  shipsQuery(): Entity[] {
    return App.activeFlight?.ships || [];
  }

  @Mutation(returns => Entity)
  shipRename(
    @Ctx() context: GraphQLContext,
    @Arg("name") name: string,
    @Arg("id", type => ID, {nullable: true}) id?: string,
  ) {
    const ship = getShip(context, id);
    ship.updateComponent("identity", {name});
    publishShip(ship);
    return ship;
  }
  @Mutation(returns => Entity)
  shipSetTheme(
    @Ctx() context: GraphQLContext,
    @Arg("theme") theme: string,
    @Arg("id", type => ID, {nullable: true}) id?: string,
  ) {
    const ship = getShip(context, id);
    ship.updateComponent("theme", {value: theme});
    publishShip(ship);
    return ship;
  }
  @Mutation(returns => Entity)
  shipSetAlertLevel(
    @Ctx() context: GraphQLContext,
    @Arg("alertLevel") alertLevel: AlertLevelT,
    @Arg("id", type => ID, {nullable: true}) id?: string,
  ) {
    const ship = getShip(context, id);
    ship.updateComponent("alertLevel", {alertLevel});
    publishShip(ship);
    return ship;
  }

  @Subscription(returns => [Entity], {
    nullable: true,
    topics: ({args, payload, context}) => {
      const id = uniqid();
      const ship = App.activeFlight?.ships.find(
        t => t.id === args.id || t.id === context.ship?.id,
      );
      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.id || context.ship?.id,
          ship,
        });
      });
      return [id, "ship"];
    },
    filter: ({args, payload, context}) => {
      return args.id === payload.shipId || context.ship?.id === payload.shipId;
    },
  })
  ship(
    @Root() payload: ShipPayload,
    @Arg("id", {nullable: true}) id: boolean,
  ): Entity {
    return payload.ship;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload, context}) => {
      const id = uniqid();
      process.nextTick(() => {
        pubsub.publish(id, {
          entities: App.activeFlight?.ships,
        });
      });
      return [id, "ships"];
    },
  })
  ships(@Root() payload: ShipsPayload): Entity[] {
    return payload.entities || [];
  }
}
