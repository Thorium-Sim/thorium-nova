import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class CamerasPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = [];
	type = "cameras" as const;
	fov: number;

	constructor(params: Partial<CamerasPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.fov = params.fov ?? 45;
	}
}
registerSystem("cameras", CamerasPlugin);
