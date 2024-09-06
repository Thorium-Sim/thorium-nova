import type BasePlugin from "../index";
import { Aspect } from "../Aspect";
import { generateIncrementedName } from "server/src/utils/generateIncrementedName";
import DeckPlugin, { DeckEdge } from "./Deck";
import { z } from "zod";
import type { Liter } from "@server/utils/unitTypes";
export const shipCategories = z.union([
	z.literal("Cruiser"),
	z.literal("Frigate"),
	z.literal("Scout"),
	z.literal("Shuttle"),
]);
export type ShipCategories = Zod.infer<typeof shipCategories>;

export default class ShipPlugin extends Aspect {
	apiVersion = "ships/v1" as const;
	kind = "ships" as const;
	name: string;
	description: string;
	/**
	 * A general category of the ship. Used to determine faction icons.
	 */
	category: ShipCategories;
	tags: string[];
	/**
	 * Asset paths are relative to the Thorium data directory.
	 */
	assets: {
		/**
		 * The path to the logo image. Best if it's a square image. SVGs are preferred.
		 */
		logo: string;
		/**
		 * The path to the 3D model. Must be in GLB or GLTF format. See the docs for instructions on how to position your model.
		 */
		model: string;
		/**
		 * The vanity (pretty) view of the ship as a PNG. Usually auto-generated from the model.
		 */
		vanity: string;
		/**
		 * The top view of the ship as a PNG. Usually auto-generated from the model.
		 */
		topView: string;
		/**
		 * The side view of the ship as a PNG. Usually auto-generated from the model.
		 */
		sideView: string;
	};
	/**
	 * The mass of the ship in kilograms
	 */
	mass: number;
	/**
	 * Length of the ship in meters. This is used to scale the 3D model
	 * which will be used for determining the width and height of the ship.
	 * This determines the size on the viewscreen and the collision hitbox.
	 */
	length: number;
	/**
	 * The list of ship systems assigned to the ship. Duplicate systems are
	 * allowed.
	 */
	shipSystems: {
		id: string;
		systemId: string;
		pluginId: string;
		overrides?: Record<string, any>;
	}[];
	/**
	 * The station theme used for this ship if it is a player ship.
	 */
	theme?: { pluginId: string; themeId: string };
	/**
	 * The decks assigned to this ship.
	 */
	decks: DeckPlugin[];
	/**
	 * The edges connecting nodes within the ship. This needs to be on the ship
	 * to support cross-deck connections.
	 */
	deckEdges: DeckEdge[];
	/** The number of cargo containers on the ship. */
	cargoContainers: number;
	/** The volume of the ship's cargo containers. */
	cargoContainerVolume: Liter;

	constructor(params: Partial<ShipPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Ship",
			plugin.aspects.ships.map((ship) => ship.name),
		);
		super({ name, ...params }, { kind: "ships" }, plugin);
		this.name = name;
		this.description =
			params.description || "Boldly going where no one has gone before.";
		this.category = params.category || "Cruiser";
		this.tags = params.tags || [];
		this.assets = params.assets || {
			logo: "",
			model: "",
			vanity: "",
			topView: "",
			sideView: "",
		};
		this.mass = params.mass || 700_000_000;
		this.length = params.length || 350;
		this.shipSystems = params.shipSystems || [];
		this.theme = params.theme || undefined;
		this.decks = params.decks?.map((deck) => new DeckPlugin(deck)) || [];
		this.deckEdges = params.deckEdges?.map((edge) => new DeckEdge(edge)) || [];
		this.cargoContainers = params.cargoContainers || 4;
		this.cargoContainerVolume = params.cargoContainerVolume || 4000;
	}
	addDeck(deck: Partial<DeckPlugin>) {
		let { name } = deck;
		const order = this.decks.length;
		if (!name) name = `Deck ${order + 1}`;
		name = generateIncrementedName(
			name,
			this.decks.map((deck) => deck.name),
		);
		const deckObj = new DeckPlugin({ name });
		this.decks.push(new DeckPlugin({ name }));

		return deckObj;
	}
	removeDeck(index: number) {
		// Remove all of the edges for that deck too
		const deckNodes = this.decks[index].nodes.map((node) => node.id);
		this.deckEdges = this.deckEdges.filter((edge) => {
			const { from, to } = edge;
			return !deckNodes.includes(from) && !deckNodes.includes(to);
		});
		this.decks.splice(index, 1);
	}
}
