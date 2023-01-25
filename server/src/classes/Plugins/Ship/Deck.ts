import {CubicMeter, Flavor} from "server/src/utils/unitTypes";
import {z} from "zod";
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
export const nodeFlagsSchema = z.union([
  z.literal("cargo"),
  z.literal("security"),
  z.literal("maintenance"),
  z.literal("medical"),
  z.literal("torpedoStorage"),
  z.literal("probeStorage"),
  z.literal("fuelStorage"),
  z.literal("coolantStorage"),
  z.literal("waterStorage"),
  z.literal("lifeSupport"),
  z.literal("crewQuarters"),
  z.literal("cafeteria"),
  z.literal("recreation"),
  z.literal("science"),
]);

export const nodeFlags = nodeFlagsSchema._def.options.map(
  flag => flag._def.value
);
export type NodeFlag = Zod.infer<typeof nodeFlagsSchema>;

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
  volume: CubicMeter;
  flags: NodeFlag[];
  systems: string[];
  contents: {} = {};
  constructor(params: Partial<DeckNode>) {
    this.id = params.id || 0;
    this.name = params.name || "";
    this.deckIndex = params.deckIndex!;
    this.x = params.x || 0;
    this.y = params.y || 0;
    this.isRoom = params.isRoom || false;
    this.icon = params.icon || "";
    this.radius = params.radius || 0;
    this.volume = params.volume || 12;
    this.flags = params.flags || [];
    this.systems = params.systems || [];
  }
}

export const edgeFlagsSchema = z.union([
  z.literal("cargoOnly"),
  z.literal("crewOnly"),
  z.literal("botsOnly"),
]);
export const edgeFlags = edgeFlagsSchema._def.options.map(
  flag => flag._def.value
);
export type EdgeFlag = Zod.infer<typeof edgeFlagsSchema>;

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
