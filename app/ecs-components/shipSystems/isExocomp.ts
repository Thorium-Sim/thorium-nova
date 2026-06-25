import { damageControlInstruction } from "@thorium/ecs-components/damageControl";
import z from "zod";

export const isExocomps = z.object({}).default({});

// Cargo is handled by the cargoContainer component
// Position is handled by the passengerMovement component
export const exocomp = z
	.object({
		shipId: z.number().default(-1),
		instructions: damageControlInstruction.array().default([]),
		instructionIndex: z.number().default(-1),
		instructionProgress: z.number().default(0),
		logs: z
			.object({
				timestamp: z.number(),
				text: z.string(),
				/** The state of the logs */
				state: z.enum(["normal", "warning", "error"]),
			})
			.array()
			.default([]),
		/** Current Charge in megawatt hours*/
		currentCharge: z.number().default(1),
		/** Max charge in megawatt hours */
		maxCharge: z.number().default(1),

		/** How fast the exocomp charges when at its home in megawatts */
		chargeRate: z.number().default(1),
		/** How fast the exocomp discharges when it is idle in megawatts*/
		idleDischargeRate: z.number().default(1),
		/** How fast the exocomp discharges when it is working in megawatts*/
		workingDischargeRate: z.number().default(1),
		/** How fast the exocomp discharges when it is moving in megawatts*/
		movingDischargeRate: z.number().default(1),
	})
	.default({});
