import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";

const actions = Object.entries(router._def.procedures)
	// @ts-expect-error This does have the meta type
	.filter(([, p]) => p._def.meta?.action)
	.map(([name]) => name);
const events = Object.entries(router._def.procedures)
	// @ts-expect-error This does have the meta type
	.filter(([, p]) => p._def.meta?.event)
	.map(([name]) => name);

export async function notifyActions(path: string, input: any) {
	// Get the metadata for this particular send
	if (actions.includes(path)) {
		// Publish it to the correct subscriber
		pubsub.publish.thorium.actionsSub({ name: path, values: input });
	}
}
export async function notifyEvents(path: string, input: any) {
	// Get the metadata for this particular send
	if (events.includes(path)) {
		// Publish it to the correct subscriber
		pubsub.publish.thorium.eventsSub({ name: path, values: input });
	}
}
