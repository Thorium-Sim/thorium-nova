import DeckPlugin, {DeckEdge} from "../classes/Plugins/Ship/Deck";
import {ShipMapGraph} from "../utils/shipMapPathfinder";
import {Component} from "./utils";

const roundTo1000 = (num: number) => Math.round(num * 1000) / 1000;
export class ShipMapComponent extends Component {
  static id = "shipMap" as const;
  static serialize(data: ShipMapComponent) {
    return {
      decks: data.decks.map(deck => ({
        ...deck,
        nodes: deck.nodes.map(
          ({flags, icon, id, isRoom, name, radius, x, y}) => {
            const output: Partial<DeckPlugin["nodes"][0]> = {
              id,
              x: roundTo1000(x),
              y: roundTo1000(y),
            };
            if (name) output.name = name;
            if (icon) output.icon = icon;
            if (isRoom) output.isRoom = isRoom;
            if (radius) output.radius = radius;
            if (flags?.length > 0) output.flags = flags;
            return output;
          }
        ),
      })),
      deckEdges: data.deckEdges.map(({id, flags, from, to, isOpen, weight}) => {
        const output: Partial<DeckEdge> = {
          id,
          from,
          to,
        };
        if (weight) output.weight = weight;
        if (!isOpen) output.isOpen = isOpen;
        if (flags?.length > 0) output.flags = flags;
        return output;
      }),
    };
  }
  decks: DeckPlugin[] = [];
  deckEdges: DeckEdge[] = [];
  graph: ShipMapGraph | null = null;
}
