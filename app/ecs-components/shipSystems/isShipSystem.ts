import z from "zod";

const shipSystemTypes = z.enum([
	"warpEngines",
	"impulseEngines",
	"generic",
	"inertialDampeners",
	"thrusters",
	"reactor",
	"battery",
	"torpedoLauncher",
	"targeting",
	"shields",
	"phasers",
	"sensors",
	"mainComputer",
	"coolantTank",
	"navigation",
	"longRangeComm",
	"cameras",
]);

export type ShipSystemTypes = z.infer<typeof shipSystemTypes>;

export const isShipSystem = z
	.object({
		type: shipSystemTypes.default("generic"),
		shipId: z.number().int().default(-1),
	})
	.default({});
