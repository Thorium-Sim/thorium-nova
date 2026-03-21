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
	/** Camera field of view in degrees (10–80). Defaults to 45. */
	fov?: number;
}

export type BridgeMapElementType = "station" | "viewscreen";

export interface BridgeMapElement {
	id: string;
	type: BridgeMapElementType;
	x: number;
	y: number;
	rotation: number;
	pitch?: number;
	width?: number;
	height?: number;
	label?: string;
	viewscreenId?: string;
	stationName?: string;
	clientName?: string;
}

export interface BridgeLevel {
	id: string;
	name: string;
	backgroundUrl: string;
	imageWidth: number;
	imageHeight: number;
	elements: BridgeMapElement[];
}

export interface SavedStationAssignment {
	clientAssignments: BridgeClientAssignment[];
	elementStations: Record<string, string>; // elementId -> stationName
}

export default class BridgePlugin extends Aspect {
	apiVersion = "bridges/v1" as const;
	kind = "bridges" as const;
	name!: string;
	description!: string;
	stationComplementRef?: { pluginId: string; stationComplementId: string };
	clientAssignments!: BridgeClientAssignment[];
	savedStationAssignments!: Record<string, SavedStationAssignment>;
	viewscreens!: BridgeViewscreen[];
	levels!: BridgeLevel[];
	assets!: Record<string, string>;
	constructor(params: Partial<BridgePlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Bridge",
			plugin.aspects.bridges.map((b) => b.name),
		);
		super(
			{ ...params, name },
			{ kind: "bridges", manifestFile: "manifest.json" },
			plugin,
			{},
		);

		this.name = this.name || name;
		this.description = this.description || params.description || "";
		this.stationComplementRef =
			this.stationComplementRef || params.stationComplementRef || undefined;
		this.clientAssignments =
			this.clientAssignments || params.clientAssignments || [];
		this.savedStationAssignments =
			this.savedStationAssignments || params.savedStationAssignments || {};
		this.viewscreens = this.viewscreens || params.viewscreens || [];
		this.levels = this.levels ||
			params.levels || [
				{
					id: crypto.randomUUID(),
					name: "Main",
					backgroundUrl: "",
					imageWidth: 800,
					imageHeight: 800,
					elements: [],
				},
			];
		this.assets = this.assets || {};
	}
}
