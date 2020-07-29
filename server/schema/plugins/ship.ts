import App from "server/app";
import {AlertLevelComponent} from "server/components/alertLevel";
import {IdentityComponent} from "server/components/identity";
import {IsShipComponent} from "server/components/isShip";
import {ShipAssetsComponent} from "server/components/shipAssets";
import {TagsComponent} from "server/components/tags";
import {ThemeComponent} from "server/components/theme";
import {appStoreDir} from "server/helpers/appPaths";
import getStore from "server/helpers/dataStore";
import Entity from "server/helpers/ecs/entity";
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
import {pubsub} from "server/helpers/pubsub";
import fs from "fs";
import {GraphQLUpload, FileUpload} from "graphql-upload";

interface ShipPayload {
  ship: Entity;
}
interface ShipsPayload {
  entities: Entity[];
}

/**
 *
 * Stuff that can be configured on a ship
 * - Theme
 * - UI Sound pack - includes ambiance
 * - Name
 * - Ship Assets
 * - Tags
 * - Systems (just add and remove systems)
 * - Decks & Rooms (including maps)
 * - Crew Count (composition is automatically generated for each flight)
 * - Docked ships (referencing other ships and providing a count. Names are automatically generated.)
 *
 * Inventory is automatically generated and distributed to rooms based
 * on the tags of the rooms, ship systems (torpedos, phaser heads, coolant, probes, etc.)
 * and the needs of the damage reports.
 */

function publishShip(ship: Entity) {
  pubsub.publish("templateShip", {shipId: ship.id, ship});
  pubsub.publish("templateShips", {
    entities: App.activeFlight?.ships,
  });
}

@Resolver()
export class ShipPluginResolver {
  @Query(returns => Entity, {nullable: true, name: "templateShip"})
  shipQuery(@Arg("id", type => ID) id: string): Entity | null {
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
      path: `${appStoreDir}ships/${name}/data.json`,
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

  @Mutation(returns => Entity)
  async templateShipSetLogo(
    @Arg("image", type => GraphQLUpload) image: FileUpload,
    @Arg("id", type => ID) id: string,
  ) {
    const ship = App.plugins.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    await new Promise((resolve, reject) => {
      const assetPath = `${appStoreDir}ships/${ship.id}/${image.filename}`;
      image
        .createReadStream()
        .pipe(fs.createWriteStream(assetPath))
        .on("finish", () => resolve(true))
        .on("error", () => reject(false));
    });
    ship.updateComponent("shipAssets", {logo: image.filename});
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
