import type BasePlugin from ".";
import { Aspect } from "./Aspect";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";

export interface BridgeClientAssignment {
	clientName: string;
	stationId: string | null;
	isSoundPlayer: boolean;
	tags: string[];
}

export interface BridgeViewscreen {
	id: string;
	name: string;
	tags: string[];
	isMainViewscreen?: boolean;
	defaultPose: { poseId: string; pluginId: string } | null;
	showGizmos?: boolean;
	showLayout?: boolean;
	brokenMode?: "fullyBroken" | "cameraBrokenOnly" | "invincible";
	/** Camera field of view in degrees (1–179). Values >= 180 yield a black screen because tan(fov/2) is mathematically undefined at 180°. Defaults to 45. */
	fov?: number;
}

interface BridgeMapElementBase {
	id: string;
	/** Horizontal position in pixels relative to the floor background image. */
	x: number;
	/** Vertical position in pixels relative to the floor background image. */
	y: number;
	/** Rotation in degrees. For viewscreens this is the default yaw angle. */
	rotation: number;
	/** Element width in pixels. */
	widthPixels?: number;
	/** Element height in pixels. */
	heightPixels?: number;
	label?: string;
	clientName?: string;
}

export interface BridgeMapStation extends BridgeMapElementBase {
	type: "station";
	stationName?: string;
}

export interface BridgeMapViewscreen extends BridgeMapElementBase {
	type: "viewscreen";
	viewscreenId?: string;
	/** Pitch angle in degrees — the default camera pitch for this viewscreen. */
	pitch?: number;
}

export type BridgeMapElement = BridgeMapStation | BridgeMapViewscreen;
export type BridgeMapElementType = BridgeMapElement["type"];

export interface BridgeFloor {
	id: string;
	name: string;
	backgroundUrl: string;
	/** Background image width in pixels. */
	widthPixels: number;
	/** Background image height in pixels. */
	heightPixels: number;
	elements: BridgeMapElement[];
}

export interface StationAssignment {
	clientAssignments: BridgeClientAssignment[];
	elementStations: Record<string, string>; // elementId -> stationName
}

export function complementKey(ref?: {
	pluginId: string;
	stationComplementId: string;
}): string | null {
	return ref ? `${ref.pluginId}:${ref.stationComplementId}` : null;
}

export default class BridgePlugin extends Aspect {
	apiVersion = "bridges/v1" as const;
	kind = "bridges" as const;
	name!: string;
	description!: string;
	stationComplementRef?: { pluginId: string; stationComplementId: string };
	/** Per-complement client and element assignments, keyed by "pluginId:complementId". */
	stationAssignments!: Record<string, StationAssignment>;
	viewscreens!: BridgeViewscreen[];
	floors!: BridgeFloor[];
	/** Default size in pixels for map elements. When undefined, defaults to 7.5% of floor width. */
	elementScale?: number;
	assets!: Record<string, string>;
	constructor(params: Partial<BridgePlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Bridge",
			plugin.aspects.bridges.map((b) => b.name),
		);
		super({ ...params, name }, { kind: "bridges" }, plugin, {});

		this.name = this.name || name;
		this.description = this.description || params.description || "";
		this.stationComplementRef =
			this.stationComplementRef || params.stationComplementRef || undefined;
		this.stationAssignments =
			this.stationAssignments || params.stationAssignments || {};
		this.viewscreens = this.viewscreens || params.viewscreens || [];
		this.floors = this.floors ||
			params.floors || [
				{
					id: crypto.randomUUID(),
					name: "Main",
					backgroundUrl: "",
					widthPixels: 800,
					heightPixels: 800,
					elements: [],
				},
			];
		this.elementScale = this.elementScale || params.elementScale || undefined;
		this.assets = this.assets || {};
	}
}
