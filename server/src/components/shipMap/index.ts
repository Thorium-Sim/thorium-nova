import DeckPlugin, {DeckEdge} from "../../classes/Plugins/Ship/Deck";
import {ShipMapGraph} from "../../utils/shipMapPathfinder";
import {Component} from "server/src/components/utils";
import {Kelvin} from "@server/utils/unitTypes";

const roundTo1000 = (num: number) => Math.round(num * 1000) / 1000;

export type ShipMapDeckNode = DeckPlugin["nodes"][0] & {
  deckIndex: number;
  contents: {
    [inventoryTemplateName: string]: {count: number; temperature: Kelvin};
  };
};
export class ShipMapComponent extends Component {
  static id = "shipMap" as const;
  static serialize(data: ShipMapComponent) {
    return {
      decks: data.decks.map(({backgroundUrl, name}) => ({
        backgroundUrl,
        name,
      })),
      deckNodes: data.deckNodes.map(
        ({
          flags,
          deckIndex,
          icon,
          id,
          isRoom,
          name,
          radius,
          x,
          y,
          contents,
          volume,
        }) => {
          const output: Partial<(typeof data)["deckNodes"][0]> = {
            id,
            deckIndex,
            x: roundTo1000(x),
            y: roundTo1000(y),
          };
          if (name) output.name = name;
          if (icon) output.icon = icon;
          if (isRoom) output.isRoom = isRoom;
          if (radius) output.radius = radius;
          if (contents) output.contents = contents;
          if (flags?.length > 0) output.flags = flags;
          if (typeof volume === "number") output.volume = volume;
          return output;
        }
      ),
      deckEdges: data.deckEdges.map(({id, flags, from, to, isOpen, weight}) => {
        const output: Partial<DeckEdge> = {
          id,
          from,
          to,
        };
        if (weight !== 1) output.weight = weight;
        if (!isOpen) output.isOpen = isOpen;
        if (flags?.length > 0) output.flags = flags;
        return output;
      }),
    };
  }
  deckNodeCache: Map<number, ShipMapDeckNode> = new Map();
  decks: Omit<DeckPlugin, "nodes">[] = [];
  deckNodes: ShipMapDeckNode[] = [];
  deckNodeMap: {
    [key: number]: DeckPlugin["nodes"][0] & {
      deckIndex: number;
      contents: {
        [inventoryTemplateName: string]: {count: number; temperature: Kelvin};
      };
    };
  } | null = null;
  deckEdges: DeckEdge[] = [];
  graph: ShipMapGraph | null = null;
}
