import { panelElementTypes } from "@thorium/ecs-components/engineeringPanelTypes";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { z } from "zod";

import type BasePlugin from ".";
import type Station from "../Station";
import { Aspect } from "./Aspect";

const baseCard = z.object({
	name: z.string(),
	icon: z.string().nullish().optional(),
	component: z.string(),
});
const engineeringPanelsCard = baseCard.extend({
	component: z.literal("EngineeringPanels"),
	config: z
		.object({
			elementCount: z.number().optional(),
			randomSeed: z.string().optional().default("thorium"),
			controls: z
				.object({
					name: z.string(),
					type: panelElementTypes,
				})
				.array()
				.optional(),
		})
		.optional(),
});

const widgetProps = {
	size: z.enum(["sm", "md", "lg", "xl"]).optional(),
	resize: z.boolean().optional(),
};

export default class StationComplementPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		hasShipMap: z.boolean(),
		assets: z.object({}),
		flightMode: z.enum(["nova", "legacy"]),
		stations: z
			.object({
				name: z.string(),
				description: z.string().optional(),
				logo: z.string().optional(),
				theme: z.string().optional(),
				tags: z.string().array().optional(),
				messageGroups: z.string().array().optional(),
				cards: z.union([baseCard, engineeringPanelsCard]).array(),
				widgets: z
					.union([baseCard.extend(widgetProps), engineeringPanelsCard.extend(widgetProps)])
					.array(),
			})
			.array(),
	});
	apiVersion = "stations/v1" as const;
	kind = "stationComplements" as const;
	name!: string;
	hasShipMap!: boolean;
	stations!: Station[];
	flightMode!: "nova" | "legacy";
	get stationCount() {
		return this.stations.length;
	}
	assets!: Record<string, string>;
	constructor(params: Partial<StationComplementPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Station Complement",
			plugin.aspects.stationComplements.map((station) => station.name),
		);
		super({ ...params, name }, { kind: "stationComplements" }, plugin);
		if (!this.name) this.name = name;
		this.stations = this.stations || params.stations || [];
		this.hasShipMap = this.hasShipMap || params.hasShipMap || false;
		this.assets = this.assets || params.assets || {};
		this.flightMode = this.flightMode || params.flightMode || "nova";
	}
}
