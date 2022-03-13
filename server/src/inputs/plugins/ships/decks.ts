import {DataContext} from "server/src/utils/DataContext";
import {moveArrayItem} from "server/src/utils/moveArrayItem";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";
import uniqid from "@thorium/uniqid";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";

export const decksPluginInputs = {
  pluginShipDeckCreate(
    context: DataContext,
    params: {pluginId: string; shipId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return null;

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
      | {backgroundImage: File | string | null}
    )
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw new Error("Ship not found");

    const deckIndex = ship.decks.findIndex(deck => deck.name === params.deckId);
    const deck = ship.decks[deckIndex];
    if (!deck) throw new Error("Deck not found");
    if ("newName" in params) {
      deck.name = generateIncrementedName(
        params.newName,
        ship.decks.map(deck => deck.name)
      );
    }
    if ("newIndex" in params && typeof params.newIndex === "number") {
      moveArrayItem(ship.decks, deckIndex, params.newIndex);
    }
    if (
      "backgroundImage" in params &&
      typeof params.backgroundImage === "string"
    ) {
      const ext = path.extname(params.backgroundImage);
      let file = params.backgroundImage;
      let filePath = `${uniqid(`deck-${deck.name}-`)}${ext}`;
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
    if ("backgroundImage" in params && params.backgroundImage === null) {
      const oldAsset = deck.backgroundUrl;
      if (oldAsset) {
        await fs.unlink(path.join(thoriumPath, oldAsset));
      }
      deck.backgroundUrl = "";
      ship.writeFile(true);
    }
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });

    return deck;
  },
};
