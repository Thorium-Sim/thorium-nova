import InventoryPlugin from "server/src/classes/Plugins/Inventory";
import {getPlugin} from "server/src/netRequests/plugins/utils";
import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {CubicMeter} from "server/src/utils/unitTypes";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";

export const pluginInventoryInputs = {
  pluginInventoryCreate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    const inventory = new InventoryPlugin({name: params.name}, plugin);
    plugin.aspects.inventory.push(inventory);

    pubsub.publish("pluginInventory", {pluginId: params.pluginId});
    return {inventoryId: inventory.name};
  },
  async pluginInventoryDelete(
    context: DataContext,
    params: {pluginId: string; inventoryId: string}
  ) {
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    const inventory = plugin.aspects.inventory.find(
      inventory => inventory.name === params.inventoryId
    );
    if (!inventory) return;
    plugin.aspects.ships.splice(plugin.aspects.inventory.indexOf(inventory), 1);

    await inventory?.removeFile();
    pubsub.publish("pluginInventory", {pluginId: params.pluginId});
  },
  async pluginInventoryUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      inventoryId: string;
      name?: string;
      description?: string;
      tags?: string[];
      plural?: string;
      volume?: CubicMeter;
      continuous?: boolean;
      flags?: InstanceType<typeof InventoryPlugin>["flags"];
      image?: File | string;
    }
  ) {
    inputAuth(context);
    const plugin = getPlugin(context, params.pluginId);
    if (!params.inventoryId) throw new Error("Inventory ID is required");
    const inventory = plugin.aspects.inventory.find(
      inventory => inventory.name === params.inventoryId
    );
    if (!inventory) return {inventoryId: ""};
    if (typeof params.description === "string")
      inventory.description = params.description;
    if (params.tags) inventory.tags = params.tags;
    if (typeof params.volume === "number") inventory.volume = params.volume;
    if (typeof params.continuous === "boolean")
      inventory.continuous = params.continuous;
    if (params.flags) inventory.flags = params.flags;
    if (typeof params.plural === "string") inventory.plural = params.plural;

    if (params.name !== inventory.name && params.name) {
      await inventory?.rename(params.name);
    }
    await fs.mkdir(path.join(thoriumPath, inventory.assetPath), {
      recursive: true,
    });
    if (typeof params.image === "string") {
      const ext = path.extname(params.image);
      await moveFile(params.image, `image${ext}`, "image");
    }

    if (params.name !== inventory.name && params.name) {
      await inventory?.rename(params.name);
    }
    pubsub.publish("pluginInventory", {pluginId: params.pluginId});
    return {inventoryId: inventory.name};

    async function moveFile(
      file: Blob | File | string,
      filePath: string,
      propertyName: "image"
    ) {
      if (!inventory) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, inventory.assetPath), {
          recursive: true,
        });
        await fs.rename(
          file,
          path.join(thoriumPath, inventory.assetPath, filePath)
        );
        inventory.assets[propertyName] = path.join(
          inventory.assetPath,
          filePath
        );
      }
    }
  },
};
