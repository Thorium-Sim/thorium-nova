import {DataContext} from "server/src/utils/DataContext";
import {moveArrayItem} from "server/src/utils/moveArrayItem";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";
import uniqid from "@thorium/uniqid";
import {
  DeckEdge,
  DeckNode,
  EdgeFlag,
  NodeFlag,
} from "server/src/classes/Plugins/Ship/Deck";
import type ShipPlugin from "../../../classes/Plugins/Ship";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";

function getDeck(
  context: DataContext,
  {pluginId, shipId, deckId}: {pluginId: string; shipId: string; deckId: string}
) {
  const plugin = getPlugin(context, pluginId);
  const ship = plugin.aspects.ships.find(ship => ship.name === shipId);
  if (!ship) throw new Error("Ship not found");

  const deck = ship.decks.find(deck => deck.name === deckId);
  if (!deck) throw new Error("Deck not found");
  return {ship, deck};
}
function getNextDeckId(ship: ShipPlugin) {
  const deckIds = ship.decks.flatMap(deck => deck.nodes.map(node => node.id));
  return Math.max(0, ...deckIds) + 1;
}
function getNextEdgeId(ship: ShipPlugin) {
  const edgeIds = ship.deckEdges.map(edge => edge.id);
  return Math.max(0, ...edgeIds) + 1;
}

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
    const {ship, deck} = getDeck(context, params);

    const deckIndex = ship.decks.findIndex(deck => deck.name === params.deckId);
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
  pluginShipDeckAddNode(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      deckId: string;
      x: number;
      y: number;
    }
  ) {
    const {ship, deck} = getDeck(context, params);
    const node = new DeckNode({
      x: params.x,
      y: params.y,
      id: getNextDeckId(ship),
    });
    deck.nodes.push(node);
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return node;
  },
  pluginShipDeckRemoveNode(
    context: DataContext,
    params: {pluginId: string; shipId: string; deckId: string; nodeId: number}
  ) {
    const {ship, deck} = getDeck(context, params);
    const node = deck.nodes.find(node => node.id === params.nodeId);
    if (!node) return;

    // Remove any connected edges.
    ship.deckEdges = ship.deckEdges.filter(edge => {
      const {from, to} = edge;
      return node.id !== from && node.id !== to;
    });
    deck.nodes = deck.nodes.filter(node => node.id !== params.nodeId);
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  async pluginShipDeckUpdateNode(
    context: DataContext,
    params: {
      pluginId: string;
      shipId: string;
      deckId: string;
      nodeId: number;
    } & (
      | {
          x: number;
          y: number;
        }
      | {name: string}
      | {isRoom: boolean}
      | {icon: File | string}
      | {radius: number}
      | {flags: NodeFlag[]}
    )
  ) {
    const {ship, deck} = getDeck(context, params);
    const node = deck.nodes.find(node => node.id === params.nodeId);
    if (!node) return;

    if ("x" in params) {
      node.x = params.x;
      node.y = params.y;
    }
    if ("name" in params) {
      node.name = params.name;
    }
    if ("isRoom" in params) {
      node.isRoom = params.isRoom;
    }
    if ("icon" in params) {
      let file = params.icon;
      if (typeof file === "string") {
        const ext = path.extname(file);
        let filePath = `${uniqid(`node-${node.id}`)}${ext}`;
        await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
          recursive: true,
        });
        await fs.rename(file, path.join(thoriumPath, ship.assetPath, filePath));
        node.icon = path.join(ship.assetPath, filePath);
        ship.writeFile(true);
      }
    }
    if ("radius" in params) {
      node.radius = params.radius;
    }
    if ("flags" in params) {
      node.flags = params.flags;
    }

    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return node;
  },
  pluginShipDeckAddEdge(
    context: DataContext,
    params: {pluginId: string; shipId: string; from: number; to: number}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw new Error("Ship not found");

    const edge = new DeckEdge({
      from: params.from,
      to: params.to,
      id: getNextEdgeId(ship),
    });
    ship.deckEdges.push(edge);
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return edge;
  },
  pluginShipDeckRemoveEdge(
    context: DataContext,
    params: {pluginId: string; shipId: string; edgeId: number}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw new Error("Ship not found");

    const edge = ship.deckEdges.find(edge => edge.id === params.edgeId);
    if (!edge) return;

    ship.deckEdges = ship.deckEdges.filter(edge => edge.id !== params.edgeId);
    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
  },
  pluginShipDeckUpdateEdge(
    context: DataContext,
    params: {pluginId: string; shipId: string; edgeId: number} & (
      | {weight: number}
      | {flags: EdgeFlag[]}
    )
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw new Error("Ship not found");

    const edge = ship.deckEdges.find(edge => edge.id === params.edgeId);
    if (!edge) return;

    if ("weight" in params) {
      edge.weight = params.weight;
    }
    if ("flags" in params) {
      edge.flags = params.flags;
    }

    pubsub.publish("pluginShip", {
      pluginId: params.pluginId,
      shipId: ship.name,
    });
    return edge;
  },
};
