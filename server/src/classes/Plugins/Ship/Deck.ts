import {Flavor} from "server/src/utils/unitTypes";

export default class DeckPlugin {
  name: string;
  backgroundUrl: string;
  nodes: DeckNode[];
  constructor(params: Partial<DeckPlugin>) {
    this.name = params.name || "Deck";
    this.backgroundUrl = params.backgroundUrl || "";
    this.nodes = params.nodes?.map(node => new DeckNode(node)) || [];
  }
}

// More flags can be added in the future.
export const nodeFlags = ["cargo"] as const;
export type NodeFlag = typeof nodeFlags[number];

type DeckNodeId = Flavor<number, "deckNodeId">;
export class DeckNode {
  id: DeckNodeId;
  name: string;
  /** Only used for in-flight use, not in plugin configuration */
  deckIndex!: number;
  x: number;
  y: number;
  isRoom: boolean;
  icon: string;
  radius: number;
  flags: NodeFlag[];
  constructor(params: Partial<DeckNode>) {
    this.id = params.id || 0;
    this.name = params.name || "";
    this.deckIndex = params.deckIndex!;
    this.x = params.x || 0;
    this.y = params.y || 0;
    this.isRoom = params.isRoom || false;
    this.icon = params.icon || "";
    this.radius = params.radius || 0;
    this.flags = params.flags || [];
  }
}

export const edgeFlags = ["cargoOnly", "crewOnly", "botsOnly"] as const;
export type EdgeFlag = typeof edgeFlags[number];
export class DeckEdge {
  id: number;
  to: DeckNodeId;
  from: DeckNodeId;
  /**
   * Multiplies how long it takes to traverse the edge.
   */
  weight: number;
  /**
   * Indicates whether the edge can be traversed. If closed, it's like
   * there is no edge there.
   */
  isOpen: boolean;
  flags: EdgeFlag[];
  constructor(params: Partial<DeckEdge>) {
    if (params.id === undefined) {
      throw new Error("DeckEdge must have an id");
    }
    this.id = params.id;
    this.to = params.to || 0;
    this.from = params.from || 0;
    this.weight = params.weight || 1;
    this.isOpen = params.isOpen || true;
    this.flags = params.flags || [];
  }
}
