import z from "zod";

export const heat = z
	.object({
		/** The current heat value in Kelvin. Defaults to room temperature. */
		heat: z.number().min(0).default(295.37),
		/**
		 * The percentage of power that passes through the system which is turned
		 * into heat.
		 */
		powerToHeat: z.number().min(0).default(0.01),
		/**
		 * The effectiveness of transferring heat into space. A multiplier
		 * for the equation P = A * a * T5
		 */
		heatDissipationRate: z.number().min(0).default(1),
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
	})
	.default({});
