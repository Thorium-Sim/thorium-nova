import App from "../../app";
import {AlertLevelComponent} from "../../components/alertLevel";
import {IdentityComponent} from "../../components/identity";
import {IsShipComponent} from "../../components/isShip";
import {ShipAssetsComponent} from "../../components/shipAssets";
import {TagsComponent} from "../../components/tags";
import {ThemeComponent} from "../../components/theme";
import {appStoreDir} from "../../helpers/appPaths";
import getStore from "../../helpers/dataStore";
import Entity from "../../helpers/ecs/entity";
import {pubsub} from "../../helpers/pubsub";
import {
  Arg,
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

function publishShip(ship: Entity) {
  pubsub.publish("templateShip", {shipId: ship.id, ship});
  pubsub.publish("templateShips", {
    entities: App.activeFlight?.ships,
  });
}

@Resolver()
export class ShipPluginResolver {
  @Query(returns => Entity, {nullable: true, name: "templateShip"})
  shipQuery(@Arg("id") id?: string): Entity | null {
    return App.plugins.ships.find(s => s.id === id) || null;
  }

  @Query(returns => [Entity], {name: "templateShips"})
  shipsQuery(): Entity[] {
    return App.plugins.ships || [];
  }
  @Mutation(returns => Entity)
  shipCreateTemplate(
    @Arg("name")
    name: string,
  ): Entity {
    if (App.plugins.ships.find(s => s.id === name)) {
      throw new Error("A ship with that name already exists.");
    }
    const entity = getStore<Entity>({
      class: Entity,
      path: `${appStoreDir}/ships/${name}/data.json`,
      initialData: new Entity(name, [
        IsShipComponent,
        AlertLevelComponent,
        ShipAssetsComponent,
        TagsComponent,
        IdentityComponent,
        ThemeComponent,
      ]),
    });

    App.plugins.ships.push(entity);
    entity.updateComponent("identity", {name});
    // publishShip(entity);

    return entity;
  }

  @Mutation(returns => Entity)
  templateShipRename(
    @Arg("name") name: string,
    @Arg("id", type => ID) id: string,
  ) {
    const ship = App.plugins.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    ship.updateComponent("identity", {name});
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  templateShipSetTheme(
    @Arg("theme") theme: string,
    @Arg("id", type => ID) id: string,
  ) {
    const ship = App.plugins.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    ship.updateComponent("theme", {value: theme});
    publishShip(ship);
    return ship;
  }

  @Subscription(returns => [Entity], {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uniqid();
      const ship = App.plugins.ships.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          shipId: args.id,
          ship,
        });
      });
      return [id, "ship"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.shipId;
    },
  })
  templateShip(@Root() payload: ShipPayload, @Arg("id") id: boolean): Entity {
    return payload.ship;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uniqid();
      process.nextTick(() => {
        pubsub.publish(id, {
          entities: App.plugins.ships,
        });
      });
      return [id, "ships"];
    },
  })
  templateShips(@Root() payload: ShipsPayload): Entity[] {
    return payload.entities || [];
  }
}
