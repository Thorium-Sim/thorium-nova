import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { t } from "@thorium/.server/init/t";
import { actionItem } from "@thorium/utils/flags/actionSchema";
import {
	selectValueQuery,
	triggerSend,
} from "@thorium/utils/.server/evaluateEntityQuery";
import { capitalCase } from "change-case";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";

export type ActionOverrides = {
	name?: string;
	type?: string;
	values?: string[];
	helper?: string;
};

export const thorium = t.router({
	hasHost: t.procedure
		.autoPublish([], () => null)
		.request(({ ctx }) => {
			const hasHost = Object.values(ctx.server.clients).some(
				(client) => client.isHost && client.connected,
			);
			return hasHost;
		}),
	claimHost: t.procedure
		.input(z.object({ clientId: z.string() }))
		.send(({ ctx, input: { clientId } }) => {
			const hasExistingHost = Object.values(ctx.server.clients).some(
				(client) => {
					return client.isHost && client.connected;
				},
			);
			if (!hasExistingHost) {
				ctx.getClient(clientId).isHost = true;
			}

			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId });
			pubsub.publish.thorium.hasHost();
		}),
	actions: t.procedure
		.autoPublish([], () => null)
		.request(function getActions({ ctx }) {
			const actions = Object.entries(router._def.procedures)
				// @ts-expect-error This does have the meta type
				.filter(([name, p]) => p._def.meta?.action)
				.map(([name, p]) => {
					// @ts-expect-error This does have the meta type
					const meta = p._def.meta;

					// @ts-expect-error This does have the input type
					let input = p._def.inputs[0];
					const inputs = meta?.inputs;
					if (inputs) {
						input = input.pick(
							inputs.reduce((acc: Record<string, boolean>, i: string) => {
								acc[i] = true;
								return acc;
							}, {}),
						);
					}

					// @ts-expect-error This does have the output type
					const output = p._def.output;
					let actionOverrides: ActionOverrides = {};
					if (typeof meta?.action === "function") {
						actionOverrides = meta?.action(ctx);
					}

					return {
						action: name,
						name: name
							.split(".")
							.map((s) => capitalCase(s))
							.join(": "),
						input: input ? zodToJsonSchema(input) : {},
						output: output ? zodToJsonSchema(output) : {},
						actionOverrides,
					};
				}) as any;

			return actions as {
				name: string;
				action: string;
				input: any;
				output: any;
				actionOverrides?: Record<string, ActionOverrides>;
			}[];
		}),
	executeActions: t.procedure
		.input(z.object({ actions: actionItem.array() }))
		.send(async ({ input, ctx }) => {
			await Promise.all(
				input.actions.map((action) =>
					triggerSend(action.action, action.values, ctx),
				),
			);
		}),
	events: t.procedure
		.autoPublish([], () => null)
		.request(function getEvents() {
			const events = Object.entries(router._def.procedures)
				// @ts-expect-error This does have the meta type
				.filter(([name, p]) => p._def.meta?.event)
				.map(([name, p]) => {
					// @ts-expect-error This does have the input type
					let input = p._def.inputs[0];
					// @ts-expect-error This does have the meta type
					const inputs = p._def.meta?.inputs;
					if (inputs) {
						input = input.pick(
							inputs.reduce((acc: Record<string, boolean>, i: string) => {
								acc[i] = true;
								return acc;
							}, {}),
						);
					}
					// @ts-expect-error This does have the output type
					const output = p._def.output;
					return {
						event: name,
						name: name
							.split(".")
							.map((s) => capitalCase(s))
							.join(": "),
						input: input ? zodToJsonSchema(input) : {},
						output: output ? zodToJsonSchema(output) : {},
					};
				}) as any;

			return events as {
				name: string;
				event: string;
				input: any;
				output: any;
			}[];
		}),
	delay: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				milliseconds: z.coerce.number(),
			}),
		)
		.send(async ({ input }) => {
			await new Promise((resolve) => setTimeout(resolve, input.milliseconds));
		}),
	setEntityComponent: t.procedure
		.meta({
			action: () => ({
				components: {
					name: "Components",
					type: "components",
				},
			}),
		})
		.input(
			z.object({
				entityId: z.coerce.number(),
				components: z
					.object({
						component: z.string(),
						property: z.string(),
						value: z.any(),
					})
					.array(),
			}),
		)
		.send(({ input, ctx }) => {
			const entity = ctx.flight?.ecs.getEntityById(input.entityId);
			if (!entity) return;

			for (let { component, property, value } of input.components) {
				if (typeof value === "object" && value !== null) {
					value = selectValueQuery(entity.ecs!, value)[0];
				}
				// @ts-expect-error
				entity.updateComponent(component, { [property]: value });
			}

			// TODO June 28, 2024: Figure out some way to notify the client that the entity has been updated
			// Maybe we have a special publish method that forces all clients to revalidate all their queries
		}),
	debug: t.procedure
		.meta({ action: true })
		.input(z.object({ message: z.string() }))
		.send(({ input }) => {
			console.debug(input.message);
		}),
});
