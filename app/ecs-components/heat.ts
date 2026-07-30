import z from "zod";

export const heat = z
	.object({
		/** The current heat value in Kelvin. Defaults to room temperature. */
		heat: z.number().min(0).default(295.37),

		/**
		 * How much volume the coolant takes up in this system in m^3.
		 * This affects both how fast systems heat up and how quickly
		 * they cool down when attached to the coolant loop.
		 * Default is a pipe 10 meters long and 1.7 meter radius
		 **/
		coolantVolume: z.number().default(100),

		/** Whether the coolant is flowing through this system */
		inCoolantLoop: z.boolean().default(false),

		/** How much heat energy in MW is applied to the system, calculated by ECS */
		heatLoad: z.number().default(0),

		/**
		 * The percentage of power that passes through the system which is turned
		 * into heat.
		 */
		powerToHeat: z.number().min(0).default(0.01),
		/**
		 * The standard heat level. When plotted, this
		 * represents the very bottom of the heat bar.
		 */
		nominalHeat: z.number().min(0).default(295.37),
		/**
		 * The temperature at which this system starts experiencing
		 * efficiency decreases due to overheating.
		 */
		maxSafeHeat: z.number().min(0).default(1000),
		/**
		 * The maximum possible temperature. Represents the very top
		 * of the heat bar graph.
		 */
		maxHeat: z.number().min(0).default(2500),
		/**
		 * Legacy: Multiplier for heat increasing or decreasing in ship systems
		 */
		legacyHeatRate: z.number().default(1),
	})
	.default({});
