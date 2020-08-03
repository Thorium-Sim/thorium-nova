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
  FieldResolver,
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
function uploadAsset(file: FileUpload, pathPrefix: string, name?: string) {
  return new Promise((resolve, reject) => {
    const assetPath = `${pathPrefix}/${name || file.filename}`;
    const readStream = file.createReadStream();
    /* istanbul ignore else */
    if (!readStream && process.env.NODE_ENV === "test") {
      resolve();
    } else {
      reject("Error creating read stream");
    }
    /* istanbul ignore next */
    return readStream
      .pipe(fs.createWriteStream(assetPath))
      .on("finish", () => {
        resolve();
      })
      .on("error", (error: Error) => {
        reject(error);
      });
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
    if (App.plugins.ships.find(s => s.identity?.name === name)) {
      throw new Error("A ship with that name already exists.");
    }
    const entity = getStore<Entity>({
      class: Entity,
      path: `${appStoreDir}ships/${name}/data.json`,
      initialData: new Entity(null, [
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
    publishShip(entity);

    return entity;
  }

  @Mutation(returns => Entity)
  templateShipRename(
    @Arg("name") name: string,
    @Arg("id", type => ID) id: string,
  ) {
    const ship = App.plugins.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    if (App.plugins.ships.find(s => s.id === name)) {
      throw new Error("A ship with that name already exists.");
    }
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
    const pathPrefix = `${appStoreDir}ships/${ship.identity?.name || ship.id}`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    await uploadAsset(image, pathPrefix, `logo.${ext}`);

    ship.updateComponent("shipAssets", {logo: `logo.${ext}`});
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  async templateShipSetModel(
    @Arg("model", type => GraphQLUpload) model: FileUpload,
    @Arg("side", type => GraphQLUpload) side: FileUpload,
    @Arg("top", type => GraphQLUpload) top: FileUpload,
    @Arg("vanity", type => GraphQLUpload) vanity: FileUpload,
    @Arg("id", type => ID) id: string,
  ) {
    const ship = App.plugins.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    const pathPrefix = `${appStoreDir}ships/${ship.identity?.name || ship.id}`;
    await Promise.all([
      uploadAsset(model, pathPrefix, "model.glb"),
      uploadAsset(top, pathPrefix, "top.png"),
      uploadAsset(side, pathPrefix, "side.png"),
      uploadAsset(vanity, pathPrefix, "vanity.png"),
    ]);
    ship.updateComponent("shipAssets", {
      model: "model.glb",
      top: "top.png",
      side: "side.png",
      vanity: "vanity.png",
    });
    publishShip(ship);
    return ship;
  }

  @Subscription(returns => Entity, {
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
      return [id, "templateShip"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.shipId;
    },
  })
  templateShip(
    @Root() payload: ShipPayload,
    @Arg("id", type => ID) id: string,
  ): Entity {
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
      return [id, "templateShips"];
    },
  })
  templateShips(@Root() payload: ShipsPayload): Entity[] {
    return payload.entities || [];
  }
}

@Resolver(of => ShipAssetsComponent)
export class ShipAssetsResolver {
  @FieldResolver()
  logo(@Root() self: ShipAssetsComponent & {entity: Entity}) {
    return self.logo
      ? `/assets/ships/${self.entity?.identity?.name || self.entity.id}/${
          self.logo
        }`
      : "";
  }
  @FieldResolver()
  model(@Root() self: ShipAssetsComponent & {entity: Entity}) {
    return self.model
      ? `/assets/ships/${self.entity?.identity?.name || self.entity.id}/${
          self.model
        }`
      : "";
  }
  @FieldResolver()
  top(@Root() self: ShipAssetsComponent & {entity: Entity}) {
    return self.top
      ? `/assets/ships/${self.entity?.identity?.name || self.entity.id}/${
          self.top
        }`
      : "";
  }
  @FieldResolver()
  side(@Root() self: ShipAssetsComponent & {entity: Entity}) {
    return self.side
      ? `/assets/ships/${self.entity?.identity?.name || self.entity.id}/${
          self.side
        }`
      : "";
  }
  @FieldResolver()
  vanity(@Root() self: ShipAssetsComponent & {entity: Entity}) {
    return self.vanity
      ? `/assets/ships/${self.entity?.identity?.name || self.entity.id}/${
          self.vanity
        }`
      : "";
  }
}
