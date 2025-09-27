import type { MegaWatt, MegaWattHour } from "@thorium/utils/unitTypes";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class NavigationPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "power"];
	type = "navigation" as const;
	calculate: boolean;
	thrusters: boolean;
	destinations: string[];
	presets: { name: string; course: { x: number; y: number; z: number } }[];
	constructor(params: Partial<NavigationPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.calculate = params.calculate ?? true;
		this.thrusters = params.thrusters || false;
		this.destinations = params.destinations || [];
		this.presets = params.presets || [];
	}
}
registerSystem("navigation", NavigationPlugin);
