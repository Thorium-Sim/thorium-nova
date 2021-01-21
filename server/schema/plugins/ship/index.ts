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
  Ctx,
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
import BasePlugin, {getPlugin} from "../basePlugin";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {ShipOutfitsComponent} from "server/components/ship/shipOutfits";
import {SizeComponent} from "server/components/size";

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

function publishShip(plugin: BasePlugin, ship: Entity) {
  pubsub.publish("pluginShip", {shipId: ship.id, ship});
  pubsub.publish("pluginShips", {
    pluginId: plugin.id,
    ships: plugin.ships,
  });
}

@Resolver()
export class ShipPluginResolver {
  @Query(returns => Entity, {nullable: true, name: "pluginShip"})
  shipQuery(
    @Arg("id", type => ID) id: string,
    @Arg("pluginId", type => ID) pluginId: string,
    @Ctx() ctx: GraphQLContext
  ): Entity | null {
    ctx.pluginId = pluginId;

    const plugin = getPlugin(pluginId);
    return plugin.ships.find(s => s.id === id) || null;
  }

  @Query(returns => [Entity], {name: "pluginShips"})
  shipsQuery(
    @Arg("pluginId", type => ID) pluginId: string,
    @Ctx() ctx: GraphQLContext
  ): Entity[] {
    ctx.pluginId = pluginId;

    const plugin = getPlugin(pluginId);
    return plugin?.ships || [];
  }
  @Query(returns => [Entity])
  allPluginShips(
    @Arg("pluginIds", type => [ID]) pluginIds: string[],
    @Ctx() ctx: GraphQLContext
  ): Entity[] {
    return pluginIds.reduce((prev: Entity[], pluginId) => {
      ctx.pluginId = pluginId;
      const plugin = getPlugin(pluginId);
      return plugin?.ships ? prev.concat(plugin.ships) : prev;
    }, []);
  }
  @Mutation(returns => Entity)
  pluginShipCreate(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("name")
    name: string
  ): Entity {
    const plugin = getPlugin(pluginId);
    if (
      plugin.ships.find(
        s => s.identity?.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error("A ship with that name already exists.");
    }
    const entity = new Entity(null, [
      IsShipComponent,
      AlertLevelComponent,
      ShipAssetsComponent,
      TagsComponent,
      IdentityComponent,
      ThemeComponent,
      ShipOutfitsComponent,
      SizeComponent,
    ]);

    plugin.ships.push(entity);
    entity.updateComponent("identity", {name});
    publishShip(plugin, entity);

    return entity;
  }

  @Mutation()
  pluginShipRemove(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("shipId", type => ID)
    shipId: string
  ): string {
    const plugin = getPlugin(pluginId);
    for (let i = 0; i < plugin.ships.length; i++) {
      if (plugin.ships[i].id === shipId) {
        plugin.ships.splice(i, 1);
        break;
      }
    }
    // TODO: Delete the associated files if they aren't associated with any other objects.
    pubsub.publish("pluginShips", {
      pluginId: plugin.id,
      ships: plugin.ships,
    });
    return "";
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
    if (
      plugin.ships.find(
        s => s.identity?.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error("A ship with that name already exists.");
    }
    ship.updateComponent("identity", {name});
    publishShip(plugin, ship);
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
    publishShip(plugin, ship);
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
    }/assets/ship/${ship.identity?.name || ship.id}`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    await uploadAsset(image, pathPrefix, `logo.${ext}`);

    ship.updateComponent("shipAssets", {logo: `logo.${ext}`});
    publishShip(plugin, ship);
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
    }/assets/ship/${ship.identity?.name || ship.id}`;

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
    publishShip(plugin, ship);
    return ship;
  }

  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uniqid();
      const plugin = getPlugin(args.pluginId);
      const ship = plugin.ships.find(t => t.id === args.id);
      if (ship) {
        ship.pluginId = args.pluginId;
      }
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
    @Arg("pluginId", type => ID) pluginId: string,
    @Ctx() ctx: GraphQLContext
  ): Entity {
    ctx.pluginId = pluginId;

    return payload.ship;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uniqid();
      const plugin = getPlugin(args.pluginId);

      process.nextTick(() => {
        pubsub.publish(id, {
          pluginId: plugin.id,
          ships: plugin.ships.map(s => {
            s.pluginId = plugin.id;
            return s;
          }),
        });
      });
      return [id, "pluginShips"];
    },
    filter({args, payload}) {
      return payload.pluginId === args.pluginId;
    },
  })
  pluginShips(
    @Root() payload: ShipsPayload,
    @Arg("pluginId", type => ID) pluginId: string,
    @Ctx() ctx: GraphQLContext
  ): Entity[] {
    ctx.pluginId = pluginId;
    return payload.ships || [];
  }
}

function getAssetBase(pluginId?: string) {
  if (!pluginId) return "";
  try {
    const plugin = getPlugin(pluginId);
    return `/assets/plugins/${plugin.name || plugin.id}/assets`;
  } catch {
    return "";
  }
}

function getShipAsset(entity?: Entity, pluginId?: string) {
  if (!entity) return "";
  const assetBase = getAssetBase(pluginId);
  return `${assetBase}/ship/${entity?.identity?.name || entity.id}/`;
}
// TODO: Make sure renaming the ship properly moves the files to the correct locations.
@Resolver(of => ShipAssetsComponent)
export class ShipAssetsResolver {
  @FieldResolver()
  logo(@Root() self: ShipAssetsComponent, @Ctx() ctx: GraphQLContext) {
    const {pluginId} = self.entity;
    return self.logo
      ? `${getShipAsset(self.entity, pluginId)}${self.logo}`
      : "";
  }
  @FieldResolver()
  model(@Root() self: ShipAssetsComponent, @Ctx() ctx: GraphQLContext) {
    const {pluginId} = self.entity;
    return self.model
      ? `${getShipAsset(self.entity, pluginId)}${self.model}`
      : "";
  }
  @FieldResolver()
  top(@Root() self: ShipAssetsComponent, @Ctx() ctx: GraphQLContext) {
    const {pluginId} = self.entity;
    return self.top ? `${getShipAsset(self.entity, pluginId)}${self.top}` : "";
  }
  @FieldResolver()
  side(@Root() self: ShipAssetsComponent, @Ctx() ctx: GraphQLContext) {
    const {pluginId} = self.entity;
    return self.side
      ? `${getShipAsset(self.entity, pluginId)}${self.side}`
      : "";
  }
  @FieldResolver()
  vanity(@Root() self: ShipAssetsComponent, @Ctx() ctx: GraphQLContext) {
    const {pluginId} = self.entity;
    return self.vanity
      ? `${getShipAsset(self.entity, pluginId)}${self.vanity}`
      : "";
  }
}
