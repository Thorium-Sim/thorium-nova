import type { Sound } from "@thorium/ecs-components/sound";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ShortRangeCommPlugin extends BaseShipSystemPlugin {
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
