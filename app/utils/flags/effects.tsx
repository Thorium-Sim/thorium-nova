import z from "zod";

export const effectOptions = z.union([
	z.object({
		type: z.literal("flash"),
		duration: z.number().optional(),
	}),
	z.object({
		type: z.literal("spark"),
		duration: z.number().optional(),
	}),
	z.object({ type: z.literal("reload") }),
	z.object({
		type: z.literal("speak"),
		message: z.string(),
		voice: z.string().optional(),
	}),
	z.object({ type: z.literal("message"), message: z.string() }),
]);

// TODO November 29, 2021 - Make these effects only work
// when the target client allows them. They should only
// work on Electron clients anyway.
// "shutdown"
// "restart"
// "sleep"
// "quit"

export interface EffectPayload {
	effect: z.infer<typeof effectOptions>;
	station: string | null;
	shipId: number | null;
	clientId: string | null;
}

export const notBridgeStation = ["Viewscreen", "Blackout", "Flight Director"];
