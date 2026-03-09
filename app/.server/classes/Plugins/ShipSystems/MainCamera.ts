import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class MainCameraPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = [];
	type = "mainCamera" as const;
	fov: number;

	constructor(params: Partial<MainCameraPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.fov = params.fov ?? 45;
	}
}
registerSystem("mainCamera", MainCameraPlugin);
