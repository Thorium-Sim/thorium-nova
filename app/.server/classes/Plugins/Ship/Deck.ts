import type { EdgeFlag } from "@thorium/utils/flags/DeckEdge";
import type { NodeFlag } from "@thorium/utils/flags/DeckNode";
import type { Flavor, Liter } from "@thorium/utils/unitTypes";

export interface DeckPlugin {
	name: string;
	backgroundUrl: string;
	nodes: DeckNode[];
}

type DeckNodeId = Flavor<number, "deckNodeId">;
export interface DeckNode {
	id: DeckNodeId;
	name: string;
	/** Only used for in-flight use, not in plugin configuration */
	deckIndex?: number;
	x: number;
	y: number;
	isRoom: boolean;
	icon: string;
	radius: number;
	volume: Liter;
	flags: NodeFlag[];
	systems: string[];
	contents: {
		[inventoryTemplateName: string]: { count: number };
	};
}

export interface DeckEdge {
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
}

export type ShipMapDeckNode = DeckPlugin["nodes"][0] & {
	deckIndex: number;
	contents: {
		[inventoryTemplateName: string]: { count: number };
	};
};
