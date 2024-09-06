import { generateIncrementedName } from "server/src/utils/generateIncrementedName";
import { Aspect } from "../Aspect";
import type BasePlugin from "..";
import type { ShipSystemTypes, ShipSystemFlags } from "./shipSystemTypes";
import type {
	Kelvin,
	KelvinPerSecond,
	MegaWatt,
} from "@server/utils/unitTypes";

const systemPlugins: Record<string, typeof BaseShipSystemPlugin> = {};
export function registerSystem(name: string, sys: typeof BaseShipSystemPlugin) {
	systemPlugins[name] = sys;
}

/**
 * The base class to use when creating system plugins
 *
 * Eventually this will include generic properties for power, heat, and efficiency
 */
export default class BaseShipSystemPlugin extends Aspect {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
	apiVersion = "shipSystems/v1" as const;
	kind = "shipSystems" as const;
	name: string;
	description: string;
	type: keyof typeof ShipSystemTypes;
	tags: string[];
	/**
	 * Extend the sub-class to include the specific images and sound effects
	 * for this system
	 */
	assets: Record<string, string[]>;
	allowMultiple: boolean;

	///////////
	// Power //
	///////////
	/** The minimum amount of power required to make this system operate */
	requiredPower: MegaWatt;
	/** The normal amount of power this system will request  */
	defaultPower: MegaWatt;
	/** The threshold of power usage for safely using this system */
	maxSafePower: MegaWatt;

	//////////
	// Heat //
	//////////
	/**
	 * The rate at which heat can transfer in or out.
	 * Heat generated by this entity isn't bound by this number
	 */
	powerToHeat: KelvinPerSecond;

	/**
	 * The effectiveness of transferring heat into space. A multiplier
	 * for the equation P = A * a * T5
	 */
	heatDissipationRate: number;

	/**
	 * The standard heat level. When plotted, this
	 * represents the very bottom of the heat bar.
	 */
	nominalHeat: Kelvin;

	/**
	 * The temperature at which this system starts experiencing
	 * efficiency decreases due to overheating.
	 */
	maxSafeHeat: Kelvin;

	/**
	 * The maximum possible temperature. Represents the very top
	 * of the heat bar graph.
	 */
	maxHeat: Kelvin;

	constructor(params: Partial<BaseShipSystemPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || `New ${params.type}`,
			plugin.aspects.shipSystems.map((sys) => sys.name),
		);
		super({ name, ...params }, { kind: "shipSystems" }, plugin);
		this.name = name || "";
		this.type = params.type || "generic";
		this.description = params.description || "";
		this.tags = params.tags || [];
		this.assets = params.assets || {
			soundEffects: [],
		};
		this.allowMultiple = params.allowMultiple ?? false;
		this.requiredPower = params.requiredPower || 5;
		this.defaultPower = params.defaultPower || 10;
		this.maxSafePower = params.maxSafePower || 20;
		this.powerToHeat = params.powerToHeat || 10;
		this.heatDissipationRate = params.heatDissipationRate || 1;
		this.nominalHeat = params.nominalHeat || 295.37;
		this.maxSafeHeat = params.maxSafeHeat || 1000;
		this.maxHeat = params.maxHeat || 2500;

		if (this.constructor.name === "BaseShipSystemPlugin") {
			if (systemPlugins[this.type]) {
				// biome-ignore lint/correctness/noConstructorReturn: <explanation>
				return new systemPlugins[this.type](params, plugin);
			}
		}
	}
}
