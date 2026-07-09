import { sound, type Sound } from "@thorium/ecs-components/sound";
import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class SensorsPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("sensors"),
		passiveRange: z.number(),
		activeRange: z.number(),
		minScanEnergyCost: z.number(),
		maxScanEnergyCost: z.number(),
		shieldPenaltyMultiplier: z.number(),
		pingActive: z.boolean(),
		autoTargeting: z.boolean(),
		scanHistory: z.boolean(),
		scanAnswers: z.object({ label: z.string(), value: z.string() }).array(),
		soundEffects: z.object({
			ambiance: sound.array().optional(),
			scanComplete: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "sensors" as const;

	passiveRange: number;
	activeRange: number;
	minScanEnergyCost: number;
	maxScanEnergyCost: number;
	shieldPenaltyMultiplier: number;

	pingActive: boolean;
	autoTargeting: boolean;
	scanHistory: boolean;
	scanAnswers: { label: string; value: string }[];

	soundEffects: {
		ambiance: Sound[];
		scanComplete: Sound[];
	};
	constructor(params: Partial<SensorsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.passiveRange = params.passiveRange || 1_000_000;
		this.activeRange = params.activeRange || 100_000;
		this.minScanEnergyCost = params.minScanEnergyCost || 5;
		this.maxScanEnergyCost = params.maxScanEnergyCost || 15;
		this.shieldPenaltyMultiplier = params.shieldPenaltyMultiplier || 2;

		/** Legacy Properties */
		this.pingActive = params.pingActive || false;
		this.autoTargeting = params.autoTargeting || false;
		this.scanHistory = params.scanHistory || false;
		this.scanAnswers = params.scanAnswers || structuredClone(defaultScanAnswers);

		this.soundEffects = params.soundEffects || {
			ambiance: [],
			scanComplete: [],
		};
	}
}
registerSystem("sensors", SensorsPlugin);

const defaultScanAnswers = [
	{ label: "None detected.", value: "None detected." },
	{
		label: "Specify",
		value: "Please specify what you wish to scan for.",
	},
	{
		label: "Does not compute",
		value: "The scan does not compute - Please restate or rephrase.",
	},
	{
		label: "Unknown",
		value: "Request is unknown or ambiguous. Please restate or clarify.",
	},
	{
		label: "Omni course",
		value: "#omnicourse",
	},
	{
		label: "Eta",
		value: "At current speed this vessel will reach its destination in **minutes, **seconds.",
	},
	{
		label: "Destination",
		value: "Now approaching destination. Recommend slowing to Full Stop.",
	},
	{ label: "Detected.", value: "Detected." },
	{
		label: "None in range",
		value: "None detected within sensor range.",
	},
	{
		label: "External sensors offline",
		value: "Unable to complete scan. External sensors are offline.",
	},
	{ label: "Invalid", value: "Invalid search query." },
	{
		label: "No probe",
		value: "Unable to complete scan.  No probe has been launched.",
	},
	{
		label: "Ship not in range",
		value: "Unable to complete scan. Ship is not within range.",
	},
	{
		label: "Radiation interference",
		value: "Radiation is interfering with sensors.  Unable to complete scan.",
	},
	{
		label: "Scanning...",
		value: "Scanning... Results will be displayed on the main view screen.",
	},
	{
		label: "Sensors damaged",
		value: "Sensor systems have been damaged.  Unable to complete scan.",
	},
	{
		label: "Which contact.",
		value: "Please specify which contact you wish to scan.",
	},
	{
		label: "Thruster Dodge",
		value: "#thrusterdodge",
	},
	{
		label: "Undocking Instructions",
		value:
			"This vessel is currently docked. The Boarding Ramps and the Docking Clamps must be retracted before the Thrusters can be used to undock.",
	},
	{
		label: "Undocking Completed",
		value:
			"This vessel has successfully undocked. It is recommended to calculate a course to our destination.",
	},
	{
		label: "Asteroids",
		value:
			"Asteroids detected in the area. It is recommended that Thrusters be used to dodge asteroids. The weapon systems can be used to destroy incoming projectiles before impact.",
	},
	{
		label: "On Course",
		value: "Now on course ",
	},
	{
		label: "Weakness",
		value: "#weakness",
	},
];
