import { DataContext } from "@thorium/.server/DataContext";
import { router, type AllSends, type SendInputs } from "@thorium/.server/init/router";
import { thoriumContext } from "@thorium/utils/.server/context";
import { callProcedure } from "@thorium/utils/live-query/.server/router";
import { onCall } from "@thorium/utils/onCallHandler";

export async function triggerAction<A extends AllSends>(
	path: A,
	input: SendInputs<A>,
	ctx?: DataContext | Record<string, any>,
) {
	const context =
		ctx instanceof DataContext
			? ctx
			: new DataContext("thorium", thoriumContext.getStore()!.database, ctx);

	return await callProcedure({
		procedures: router._def.procedures,
		type: "send",
		path: path,
		rawInput: input,
		ctx: context,
		onCall: (opts, result) => onCall(opts, result, context.ecs),
	});
}
