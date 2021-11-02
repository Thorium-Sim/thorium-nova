import path from "path";
import ShipPlugin, {ShipCategories} from "server/src/classes/Plugins/Ship";
import {promises as fs} from "fs";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "./utils";
import {thoriumPath} from "server/src/utils/appPaths";

export const shipsPluginInputs = {
  pluginShipCreate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = new ShipPlugin({name: params.name}, plugin);
    plugin.aspects.ships.push(ship);

    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    return {shipId: ship.name};
  },
  async pluginShipDelete(
    context: DataContext,
    params: {pluginId: string; shipId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    plugin.aspects.ships.splice(plugin.aspects.ships.indexOf(ship), 1);

    await ship?.removeFile();
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
  },
  async pluginShipSetName(
    context: DataContext,
    params: {pluginId: string; shipId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return {shipId: ""};
    await ship?.rename(params.name);
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return {shipId: ship.name};
  },
  pluginShipSetDescription(
    context: DataContext,
    params: {pluginId: string; shipId: string; description: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    ship.description = params.description;
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  pluginShipSetCategory(
    context: DataContext,
    params: {pluginId: string; shipId: string; category: ShipCategories}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    ship.category = params.category;
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  pluginShipSetTags(
    context: DataContext,
    params: {pluginId: string; shipId: string; tags: string[]}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    ship.tags = params.tags;
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  pluginShipSetMass(
    context: DataContext,
    params: {pluginId: string; shipId: string; mass: number}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    if (isNaN(params.mass) || params.mass <= 0) {
      throw new Error("Mass must be a number greater than 0");
    }
    ship.mass = params.mass;
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  pluginShipSetLength(
    context: DataContext,
    params: {pluginId: string; shipId: string; length: number}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    if (isNaN(params.length) || params.length <= 0) {
      throw new Error("Length must be a number greater than 0");
    }
    ship.length = params.length;
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  async pluginShipSetLogo(
    context: DataContext,
    params: {pluginId: string; shipId: string; logo: File | string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    if (typeof params.logo === "string") {
      const ext = path.extname(params.logo);

      await fs.mkdir(path.join(thoriumPath, ship.assetPath), {recursive: true});
      await fs.rename(
        params.logo,
        path.join(thoriumPath, ship.assetPath, `logo${ext}`)
      );

      ship.assets.logo = `logo${ext}`;

      pubsub.publish("pluginShips", {pluginId: params.pluginId});
      pubsub.publish("pluginShip", {
        pluginId: params.pluginId,
        shipId: ship.name,
      });
    }
  },
  async pluginShipSetModel(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      model: File | string;
      top: Blob | string;
      side: Blob | string;
      vanity: Blob | string;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;

    moveFile(params.model, "model.glb");
    moveFile(params.top, "topView.png");
    moveFile(params.side, "sideView.png");
    moveFile(params.vanity, "vanity.png");

    ship.assets.model = "model.glb";
    ship.assets.topView = "topView.png";
    ship.assets.sideView = "sideView.png";
    ship.assets.vanity = "vanity.png";

    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });

    async function moveFile(file: Blob | File | string, filePath: string) {
      if (!ship) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
          recursive: true,
        });
        await fs.rename(file, path.join(thoriumPath, ship.assetPath, filePath));
      }
    }
  },
};
