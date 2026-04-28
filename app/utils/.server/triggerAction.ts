import { DataContext } from "@thorium/.server/DataContext";
import { router, type AllSends, type SendInputs } from "@thorium/.server/init/router";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { callProcedure } from "@thorium/utils/live-query/.server/router";

import { DataStore } from "./db-fs";

export async function triggerAction<A extends AllSends>(
	path: A,
	input: SendInputs<A>,
	ctx?: DataContext,
) {
	const context = ctx || new DataContext("thorium", DataStore.operations.getStore()!.database);

	return await callProcedure({
		procedures: router._def.procedures,
		type: "send",
		path: path,
		rawInput: input,
		ctx: context,
		onCall: (opts, result) => {
			const ecs = ctx?.flight?.ecs;
			if (!ecs || opts.type !== "send") return;

			processTriggers(ecs, {
				event: opts.path,
				values: {
					...(opts.rawInput as any),
					...(typeof result === "object" && !Array.isArray(result) ? result : {}),
				},
			});
		},
	});
}
