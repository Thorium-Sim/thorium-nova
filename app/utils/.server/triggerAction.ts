import { DataContext } from "@thorium/.server/DataContext";
import { database } from "@thorium/.server/init/buildDatabase";
import { router } from "@thorium/.server/init/router";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { callProcedure } from "@thorium/utils/live-query/.server/router";

export async function triggerAction(
	path: string,
	input: any,
	ctx?: DataContext,
) {
	const context = ctx || new DataContext("thorium", database);

	return await callProcedure({
		procedures: router._def.procedures,
		type: "send",
		path: path,
		rawInput: input,
		ctx: context,
		onCall: (opts) => {
			const ecs = ctx?.flight?.ecs;
			if (!ecs || opts.type !== "send") return;

			processTriggers(ecs, {
				event: opts.path,
				values: {
					...(opts.rawInput as any),
				},
			});
		},
	});
}
