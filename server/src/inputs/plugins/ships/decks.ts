import {DataContext} from "server/src/utils/DataContext";
import {moveArrayItem} from "server/src/utils/moveArrayItem";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";
import uniqid from "@thorium/uniqid";

export const decksPluginInputs = {
  pluginShipDeckCreate(
    context: DataContext,
    params: {pluginId: string; shipId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;

    const deckIndex = ship.addDeck({});

    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return deckIndex;
  },
  pluginShipDeckDelete(
    context: DataContext,
    params: {pluginId: string; shipId: string; index: number}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;

    ship.removeDeck(params.index);

    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  async pluginShipDeckUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      index: number;
      name?: string;
      newIndex?: number;
      backgroundImage?: File | string;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;

    const deck = ship.decks[params.index];

    if (params.name) {
      deck.name = params.name;
    }
    if (typeof params.newIndex === "number") {
      moveArrayItem(ship.decks, params.index, params.newIndex);
      moveArrayItem(ship.assets.decks, params.index, params.newIndex);
    }
    if (params.backgroundImage && typeof params.backgroundImage === "string") {
      const ext = path.extname(params.backgroundImage);
      let file = params.backgroundImage;
      let filePath = `${uniqid(`deck-${params.index}`)}.${ext}`;
      if (!ship) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
          recursive: true,
        });
        await fs.rename(file, path.join(thoriumPath, ship.assetPath, filePath));
        ship.assets.decks =
          ship.assets.decks ||
          Array.from({length: ship.decks.length}).fill(null);
        ship.assets.decks[params.index] = filePath;
        ship.writeFile(true);
      }
    }
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });

    return params.newIndex || params.index;
  },
};
