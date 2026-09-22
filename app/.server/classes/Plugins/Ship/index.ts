import { edgeFlagsSchema } from "@thorium/utils/flags/DeckEdge";
import { nodeFlagsSchema } from "@thorium/utils/flags/DeckNode";
import { shipCategories, type ShipCategories } from "@thorium/utils/flags/shipClasses";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type { Liter } from "@thorium/utils/unitTypes";
import z from "zod";

import { Aspect } from "../Aspect";
import type BasePlugin from "../index";
import type { DeckPlugin, DeckEdge } from "./Deck";

export default class ShipPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		nameTemplate: z.string(),
		description: z.string(),
		category: shipCategories,
		tags: z.string().array(),

		mass: z.number(),
		length: z.number(),
		shipSystems: z
			.object({
				id: z.string(),
				systemId: z.string(),
				pluginId: z.string(),
				overrides: z.record(z.any()).optional(),
			})
			.array(),
		theme: z
			.object({
				pluginId: z.string(),
				themeId: z.string(),
			})
			.optional(),
		cargoContainers: z.number(),
		cargoContainerVolume: z.number(),
		decks: z
			.object({
				name: z.string(),
				backgroundUrl: z.string(),
				nodes: z
					.object({
						id: z.number(),
						name: z.string(),
						x: z.number(),
						y: z.number(),
						isRoom: z.boolean(),
						icon: z.string().optional(),
						radius: z.number(),
						volume: z.number(),
						flags: nodeFlagsSchema.array(),
						systems: z.string().array(),
						contents: z.record(z.object({ count: z.number() })),
					})
					.array(),
			})
			.array(),
		deckEdges: z
			.object({
				id: z.number(),
				to: z.number(),
				from: z.number(),
				weight: z.number(),
				isOpen: z.boolean(),
				flags: edgeFlagsSchema.array(),
			})
			.array(),
		assets: z.object({
			logo: z.string().optional(),
			model: z.string().optional(),
			vanity: z.string().optional(),
			topView: z.string().optional(),
			sideView: z.string().optional(),
		}),
		dockingPorts: z
			.object({
				name: z.string(),
				incomingCategories: shipCategories.array(),
				allowOutgoing: z.boolean(),
				position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
				orientation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
			})
			.array(),
	});
	apiVersion = "ships/v1" as const;
	kind = "ships" as const;
	name: string;
	nameTemplate: string;
	description: string;
	/**
	 * A general category of the ship. Used to determine faction icons and docking compatibility.
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

	/** Define the docking ports for this ship. */
	dockingPorts: DockingPort[];

	constructor(params: Partial<ShipPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Ship",
			plugin.aspects.ships.map((ship) => ship.name),
		);
		super({ name, ...params }, { kind: "ships" }, plugin);
		this.name = name;
		this.nameTemplate =
			params.nameTemplate || "{~Alpha,Bravo,Charlie,Delta,Echo} {~1,2,3,4,5,6,7,8,9,10}";
		this.description = params.description || "Boldly going where no one has gone before.";
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
		this.decks = params.decks || [];
		this.deckEdges = params.deckEdges || [];
		this.cargoContainers = params.cargoContainers || 4;
		this.cargoContainerVolume = params.cargoContainerVolume || 4000;
		this.dockingPorts = params.dockingPorts || [];
	}
	addDeck(deck: Partial<DeckPlugin>) {
		let { name } = deck;
		const order = this.decks.length;
		if (!name) name = `Deck ${order + 1}`;
		name = generateIncrementedName(
			name,
			this.decks.map((deck) => deck.name),
		);
		const deckObj = { name, backgroundUrl: "", nodes: [] };
		this.decks.push(deckObj);

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
	addDockingPort(dockingPort: Pick<DockingPort, "position" | "orientation"> & { name?: string }) {
		let { name } = dockingPort;
		const order = this.dockingPorts.length;
		if (!name) name = `Docking Port ${order + 1}`;
		name = generateIncrementedName(
			name,
			this.dockingPorts.map((dockingPort) => dockingPort.name),
		);
		const dockingPortObj = { ...dockingPort, name, incomingCategories: [], allowOutgoing: true };
		this.dockingPorts.push(dockingPortObj);

		return dockingPortObj;
	}
	removeDockingPort(index: number) {
		this.dockingPorts.splice(index, 1);
	}
}
/** Exterior 1-to-1 docking interfaces */
export interface DockingPort {
	name: string;
	/** Which classes of ships this docking port allows to dock with it. Leave empty to prevent other ships docking.*/
	incomingCategories: ShipCategories[];
	/** Allows this docking port to dock with other docking ports. */
	allowOutgoing: boolean;
	/** Where the docking port is relative to the center of the ship model, measured in meters */
	position: { x: number; y: number; z: number };
	/** A normalized vector directing which way the opposing docking port should connect */
	orientation: { x: number; y: number; z: number };
	// TODO September 21, 2026 ⛰️ 💨 🔥 - Someday we should have a way to define ships that are already docked when this ship spawns.
}
