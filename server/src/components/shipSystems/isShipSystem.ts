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
]);

export const isShipSystem = z
	.object({
		type: shipSystemTypes.default("generic"),
		shipId: z.number().int().default(-1),
	})
	.default({});
