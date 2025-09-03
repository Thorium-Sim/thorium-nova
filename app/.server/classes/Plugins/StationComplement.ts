import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type BasePlugin from ".";
import type Station from "../Station";
import { Aspect } from "./Aspect";

export default class StationComplementPlugin extends Aspect {
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
		super({ ...params, name }, { kind: "stationComplements" }, plugin, {});
		if (!this.name) this.name = name;
		this.stations = this.stations || params.stations || [];
		this.hasShipMap = this.hasShipMap || params.hasShipMap || false;
		this.assets = this.assets || params.assets || {};
		this.flightMode = this.flightMode || params.flightMode || "nova";
	}
}
