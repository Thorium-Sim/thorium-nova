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
	z.object({
		type: z.literal("message"),
		title: z.string(),
		body: z.string().optional(),
		duration: z.number().optional(),
	}),
]);

// TODO November 29, 2021 - Make these effects only work
// when the target client allows them. They should only
// work on Electron clients anyway.
// "shutdown"
// "restart"
// "sleep"
// "quit"

export type EffectPayload = {
	effect: z.infer<typeof effectOptions>;
} & ({ station?: string | null; shipId: number } | { clientId: string });

export const notBridgeStation = ["Viewscreen", "Blackout", "Flight Director"];
