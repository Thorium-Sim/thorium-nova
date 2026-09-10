import { notifyActions, notifyEvents } from "@thorium/utils/.server/notifyActions";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import type { ECS } from "@thorium/utils/ecs";
import type { ProcedureCallOptions } from "@thorium/utils/live-query/.server/procedure";

export async function onCall(opts: ProcedureCallOptions, result: unknown, ecs?: ECS) {
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
}
