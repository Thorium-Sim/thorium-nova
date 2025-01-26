import { z } from "zod";

export const effectOptions = z.union([
	z.literal("flash"),
	z.literal("spark"),
	z.literal("reload"),
	z.literal("speak"),
	z.literal("message"),
	z.literal("sound"),
]);

// TODO November 29, 2021 - Make these effects only work
// when the target client allows them. They should only
// work on Electron clients anyway.
// "shutdown"
// "restart"
// "sleep"
// "quit"

export const effectConfig = z.object({
	message: z.string().optional(),
	voice: z.string().optional(),
	duration: z.number().optional(),
});

export interface EffectPayload {
	effect: Zod.infer<typeof effectOptions>;
	config: Zod.infer<typeof effectConfig> | null;
	station: string | null;
	shipId: number | null;
	clientId: string | null;
}

export const notBridgeStation = ["Viewscreen", "Blackout", "Flight Director"];
