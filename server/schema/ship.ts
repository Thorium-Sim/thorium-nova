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
import {shipPublish} from "./plugins/ship/utils";

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

  @Mutation(returns => Entity, {
    nullable: true,
    deprecationReason:
      "Creates a raw ship. Can be manually assembled, instead of using a template ship, but typically just used for testing. Use 'shipSpawn' instead.",
  })
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
    shipPublish({ship});
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
    shipPublish({ship});
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
    shipPublish({ship, detailed: true});
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
    // TODO: Send a notification to the message bus to let the crew know that
    // another ship has gone to red alert.
    shipPublish({ship, detailed: true});
    return ship;
  }
}
