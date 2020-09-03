import App from "../app";
import {AlertLevelComponent, AlertLevelT} from "../components/ship/alertLevel";
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
import {IsShipComponent} from "../components/isShip";
import {ShipAssetsComponent} from "../components/ship/shipAssets";
import {TagsComponent} from "../components/tags";
import {IdentityComponent} from "../components/identity";
import {ThemeComponent} from "../components/theme";

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
    @Arg("id", type => ID, {nullable: true}) id?: string
  ): Entity | null {
    return getShip(context, id);
  }

  @Query(returns => [Entity], {name: "ships"})
  shipsQuery(): Entity[] {
    return App.activeFlight?.ships || [];
  }

  @Mutation(returns => Entity, {nullable: true})
  shipCreate(@Arg("name") name: string): Entity | null {
    if (!App.activeFlight) return null;
    const ship = new Entity(name, [
      IsShipComponent,
      AlertLevelComponent,
      ShipAssetsComponent,
      TagsComponent,
      IdentityComponent,
      ThemeComponent,
    ]);
    ship.updateComponent("identity", {name});
    App.activeFlight.ecs.addEntity(ship);
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  shipRename(
    @Ctx() context: GraphQLContext,
    @Arg("name") name: string,
    @Arg("id", type => ID, {nullable: true}) id?: string
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
    @Arg("id", type => ID, {nullable: true}) id?: string
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
    @Arg("id", type => ID, {nullable: true}) id?: string
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
        t => t.id === args.id || t.id === context.ship?.id
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
    @Arg("id", type => ID, {nullable: true}) id: string
  ): Entity {
    return payload?.ship;
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
