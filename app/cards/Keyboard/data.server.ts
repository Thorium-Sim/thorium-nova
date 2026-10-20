import { t } from "@thorium/.server/init/t";
import { produce } from "immer";
import z from "zod";

export const keyboard = t.router({
	executeKeyPress: t.procedure
		.input(
			z.object({
				clientId: z.string(),
				keyId: z.string(),
				pressType: z.enum(["downBlocks", "upBlocks"]),
			}),
		)
		.send(async ({ ctx, input }) => {
			const entity = ctx.getFlightClient(input.clientId);
			const keyboard = entity?.components.keyboard;
			if (!keyboard) throw new Error(`Keyboard not found for client ${input.clientId}`);
			const key = keyboard.keys[input.keyId];
			if (!key) throw new Error(`Key not found for keyID ${input.keyId}`);
			const blocks = key[input.pressType] || [];
			const flightClient = entity?.components.flightClient;
			const [keyCode] = input.keyId.split("-");
			const vars = {
				...key.localVariables,
				shipId: flightClient?.shipId,
				station: flightClient?.stationId,
				keyCode,
			};
			const { localVariables } = await ctx.ecs.executeBlocks(blocks || [], {
				executionType: "main",
				localVariables: vars,
			});
			entity?.updateComponent("keyboard", {
				keys: produce(keyboard.keys, (draft) => {
					if (input.pressType === "downBlocks") {
						draft[input.keyId].localVariables = localVariables;
					} else {
						draft[input.keyId].localVariables = null;
					}
				}),
			});
		}),
});
