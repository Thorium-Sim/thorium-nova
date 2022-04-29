import path from "path";
import ShipPlugin, {ShipCategories} from "server/src/classes/Plugins/Ship";
import {promises as fs} from "fs";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";
import {thoriumPath} from "server/src/utils/appPaths";
import inputAuth from "server/src/utils/inputAuth";

export const shipsPluginInputs = {
  pluginShipCreate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    inputAuth(context);
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
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    plugin.aspects.ships.splice(plugin.aspects.ships.indexOf(ship), 1);

    await ship?.removeFile();
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
  },
  async pluginShipUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      name?: string;
      category?: ShipCategories;
      description?: string;
      tags?: string[];
      mass?: number;
      length?: number;
      logo?: string | File;
      model?: File | string;
      top?: Blob | string;
      side?: Blob | string;
      vanity?: Blob | string;
      theme?: {themeId: string; pluginId: string};
    }
  ) {
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    if (!params.shipId) throw new Error("Ship ID is required");
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return {shipId: ""};
    if (params.category) ship.category = params.category;
    if (params.description) ship.description = params.description;
    if (params.tags) ship.tags = params.tags;
    if (params.mass) {
      if (isNaN(params.mass) || params.mass <= 0) {
        throw new Error("Mass must be a number greater than 0");
      }
      ship.mass = params.mass;
    }
    if (params.length) {
      if (isNaN(params.length) || params.length <= 0) {
        throw new Error("Length must be a number greater than 0");
      }
      ship.length = params.length;
    }
    await fs.mkdir(path.join(thoriumPath, ship.assetPath), {recursive: true});
    if (typeof params.logo === "string") {
      const ext = path.extname(params.logo);
      await moveFile(params.logo, `logo${ext}`, "logo");
    }
    if (typeof params.model === "string")
      await moveFile(params.model, "model.glb", "model");
    if (typeof params.top === "string")
      await moveFile(params.top, "top.png", "topView");
    if (typeof params.side === "string")
      await moveFile(params.side, "side.png", "sideView");
    if (typeof params.vanity === "string")
      await moveFile(params.vanity, "vanity.png", "vanity");

    if (params.theme) {
      const themePlugin = getPlugin(context, params.theme.pluginId);
      const theme = themePlugin.aspects.themes.find(
        theme => theme.name === params.theme?.themeId
      );
      if (!theme) throw new Error("Theme not found");
      ship.theme = params.theme;
    }

    if (params.name !== ship.name && params.name) {
      await ship?.rename(params.name);
    }
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return {shipId: ship.name};

    async function moveFile(
      file: Blob | File | string,
      filePath: string,
      propertyName: "logo" | "model" | "topView" | "sideView" | "vanity"
    ) {
      if (!ship) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
          recursive: true,
        });
        await fs.rename(file, path.join(thoriumPath, ship.assetPath, filePath));
        ship.assets[propertyName] = path.join(ship.assetPath, filePath);
      }
    }
  },
  pluginShipToggleSystem(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      systemId: string;
      systemPlugin: string;
    }
  ) {
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    if (!params.shipId) throw new Error("Ship ID is required");
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return {shipId: ""};

    const systemPlugin = getPlugin(context, params.systemPlugin);
    const system = systemPlugin.aspects.shipSystems.find(
      system => system.name === params.systemId
    );
    if (!system) return ship;

    const existingSystem = ship.shipSystems.find(
      system =>
        system.systemId === params.systemId &&
        system.pluginId === params.systemPlugin
    );

    if (existingSystem) {
      ship.shipSystems.splice(ship.shipSystems.indexOf(existingSystem), 1);
    } else {
      ship.shipSystems.push({
        systemId: params.systemId,
        pluginId: params.systemPlugin,
      });
    }

    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });

    return ship;
  },
};
