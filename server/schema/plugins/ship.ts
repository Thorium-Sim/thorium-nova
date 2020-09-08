import App from "server/app";
import {AlertLevelComponent} from "server/components/ship/alertLevel";
import {IdentityComponent} from "server/components/identity";
import {IsShipComponent} from "server/components/isShip";
import {ShipAssetsComponent} from "server/components/ship/shipAssets";
import {TagsComponent} from "server/components/tags";
import {ThemeComponent} from "server/components/theme";
import {appStoreDir} from "server/helpers/appPaths";
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
import {GraphQLUpload, FileUpload} from "graphql-upload";
import uploadAsset from "server/helpers/uploadAsset";
import {getPlugin} from "./basePlugin";

interface ShipPayload {
  ship: Entity;
}
interface ShipsPayload {
  ships: Entity[];
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
  pubsub.publish("pluginShip", {shipId: ship.id, ship});
  pubsub.publish("pluginShips", {
    entities: App.activeFlight?.ships,
  });
}

@Resolver()
export class ShipPluginResolver {
  @Query(returns => Entity, {nullable: true, name: "pluginShip"})
  shipQuery(
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity | null {
    const plugin = getPlugin(pluginId);
    return plugin.ships.find(s => s.id === id) || null;
  }

  @Query(returns => [Entity], {name: "pluginShips"})
  shipsQuery(@Arg("pluginId", type => ID) pluginId: string): Entity[] {
    const plugin = getPlugin(pluginId);
    return plugin?.ships || [];
  }
  @Mutation(returns => Entity)
  pluginShipCreate(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("name")
    name: string
  ): Entity {
    const plugin = getPlugin(pluginId);
    if (plugin.ships.find(s => s.identity?.name === name)) {
      throw new Error("A ship with that name already exists.");
    }
    const entity = new Entity(null, [
      IsShipComponent,
      AlertLevelComponent,
      ShipAssetsComponent,
      TagsComponent,
      IdentityComponent,
      ThemeComponent,
    ]);

    plugin.ships.push(entity);
    entity.updateComponent("identity", {name});
    publishShip(entity);

    return entity;
  }

  @Mutation(returns => Entity)
  pluginShipRename(
    @Arg("name") name: string,
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ) {
    const plugin = getPlugin(pluginId);
    const ship = plugin.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    if (plugin.ships.find(s => s.id === name)) {
      throw new Error("A ship with that name already exists.");
    }
    ship.updateComponent("identity", {name});
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  pluginShipSetTheme(
    @Arg("theme") theme: string,
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ) {
    const plugin = getPlugin(pluginId);
    const ship = plugin.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    ship.updateComponent("theme", {value: theme});
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  async pluginShipSetLogo(
    @Arg("image", type => GraphQLUpload) image: FileUpload,
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ) {
    const plugin = getPlugin(pluginId);
    const ship = plugin.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    const pathPrefix = `${appStoreDir}plugins/${
      plugin.name || plugin.id
    }/assets/${ship.identity?.name || ship.id}`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    await uploadAsset(image, pathPrefix, `logo.${ext}`);

    ship.updateComponent("shipAssets", {logo: `logo.${ext}`});
    publishShip(ship);
    return ship;
  }

  @Mutation(returns => Entity)
  async pluginShipSetModel(
    @Arg("model", type => GraphQLUpload) model: FileUpload,
    @Arg("side", type => GraphQLUpload) side: FileUpload,
    @Arg("top", type => GraphQLUpload) top: FileUpload,
    @Arg("vanity", type => GraphQLUpload) vanity: FileUpload,
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ) {
    const plugin = getPlugin(pluginId);
    const ship = plugin.ships.find(s => s.id === id) || null;
    if (!ship) throw new Error("Unable to find ship.");
    const pathPrefix = `${appStoreDir}plugins/${
      plugin.name || plugin.id
    }/assets/${ship.identity?.name || ship.id}`;
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
      const plugin = getPlugin(args.pluginId);
      const ship = plugin.ships.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          pluginId: plugin.id,
          shipId: args.id,
          ship,
        });
      });
      return [id, "pluginShip"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.shipId;
    },
  })
  pluginShip(
    @Root() payload: ShipPayload,
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity {
    return payload.ship;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uniqid();
      const plugin = getPlugin(args.pluginId);
      process.nextTick(() => {
        pubsub.publish(id, {
          ships: plugin.ships,
        });
      });
      return [id, "pluginShips"];
    },
  })
  pluginShips(
    @Root() payload: ShipsPayload,
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity[] {
    return payload.ships || [];
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
