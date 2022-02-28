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
      deckId: string;
    } & (
      | {newName: string}
      | {newIndex: number}
      | {backgroundImage: File | string}
    )
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw new Error("Ship not found");

    const deck = ship.decks.find(deck => deck.name === params.deckId);
    if (!deck) throw new Error("Deck not found");
    if ("newName" in params) {
      deck.name = params.newName;
    }
    if ("newIndex" in params && typeof params.newIndex === "number") {
      const oldIndex = ship.decks.indexOf(deck);
      moveArrayItem(ship.decks, oldIndex, params.newIndex);
    }
    if (
      "backgroundImage" in params &&
      typeof params.backgroundImage === "string"
    ) {
      const ext = path.extname(params.backgroundImage);
      let file = params.backgroundImage;
      let filePath = `${uniqid(`deck-${deck.name}`)}.${ext}`;
      if (!ship) return;
      if (typeof file === "string") {
        await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
          recursive: true,
        });
        await fs.rename(file, path.join(thoriumPath, ship.assetPath, filePath));
        deck.backgroundUrl = path.join(ship.assetPath, filePath);
        ship.writeFile(true);
      }
    }
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });

    return deck;
  },
};
