import { sound, type Sound } from "@thorium/ecs-components/sound";
import { z } from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ShortRangeCommPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("shortRangeComm"),

		minRadius: z.number(),
		maxRadius: z.number(),

		soundEffects: z.object({
			incomingHail: sound.array().optional(),
			outgoingHail: sound.array().optional(),
			connected: sound.array().optional(),
			incomingConnection: sound.array().optional(),
			disconnected: sound.array().optional(),
			rejected: sound.array().optional(),
			cancelled: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "power", "sounds"];
	type = "shortRangeComm" as const;

	minRadius: number;
	maxRadius: number;

	soundEffects: {
		incomingHail: Sound[];
		outgoingHail: Sound[];
		connected: Sound[];
		incomingConnection: Sound[];
		disconnected: Sound[];
		rejected: Sound[];
		cancelled: Sound[];
	};

	constructor(params: Partial<ShortRangeCommPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.minRadius = params.minRadius ?? 10_000;
		this.maxRadius = params.maxRadius ?? 1_000_000;
		this.soundEffects = params.soundEffects ?? {
			incomingHail: [],
			outgoingHail: [],
			connected: [],
			incomingConnection: [],
			disconnected: [],
			rejected: [],
			cancelled: [],
		};
	}
}
registerSystem("shortRangeComm", ShortRangeCommPlugin);
