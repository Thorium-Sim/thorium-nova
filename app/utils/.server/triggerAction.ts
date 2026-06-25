import { DataContext } from "@thorium/.server/DataContext";
import { router, type AllSends, type SendInputs } from "@thorium/.server/init/router";
import { notifyActions, notifyEvents } from "@thorium/utils/.server/notifyActions";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { callProcedure } from "@thorium/utils/live-query/.server/router";

import { DataStore } from "./db-fs";

export async function triggerAction<A extends AllSends>(
	path: A,
	input: SendInputs<A>,
	ctx?: DataContext | Record<string, any>,
) {
	const context =
		ctx instanceof DataContext
			? ctx
			: new DataContext("thorium", DataStore.operations.getStore()!.database, ctx);

	return await callProcedure({
		procedures: router._def.procedures,
		type: "send",
		path: path,
		rawInput: input,
		ctx: context,
		onCall: (opts, result) => {
			const ecs = context?.flight?.ecs;
			if (!ecs || opts.type !== "send") return;

			void notifyActions(opts.path, opts.rawInput);
			void notifyEvents(opts.path, {
				...(opts.rawInput as any),
				...(typeof result === "object" && !Array.isArray(result) ? result : {}),
			});
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
