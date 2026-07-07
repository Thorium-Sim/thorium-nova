import path from "node:path";

import { getPlugin } from "@thorium/.server/data/plugins/utils";
import { traverseFiles } from "@thorium/.server/data/traverseFiles";
import { pubsub } from "@thorium/.server/init/pubsub";
import { router, type AllSends } from "@thorium/.server/init/router";
import { t } from "@thorium/.server/init/t";
import { selectValueQuery } from "@thorium/utils/.server/evaluateEntityQuery";
import { runInSandbox } from "@thorium/utils/.server/runInSandbox";
import { Entity } from "@thorium/utils/ecs";
import { actionItem } from "@thorium/utils/flags/actionSchema";
import { capitalCase } from "change-case";
import z from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type ActionOverrides = {
	name?: string;
	type?: string;
	values?: string[];
	helper?: string;
	inputProps?: Record<string, any>;
};

export interface FileOrFolder {
	name: string;
	fullPath: string;
	contents?: FileOrFolder[] | null;
}

export const thorium = t.router({
	actions: t.procedure
		.autoPublish([], () => null)
		.request(function getActions({ ctx }) {
			const actions = Object.entries(router._def.procedures)
				// @ts-expect-error This does have the meta type
				.filter(([, p]) => p._def.meta?.action)
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
					ctx.ecs.triggerAction(action.action as AllSends, action.values, ctx),
				),
			);
		}),
	note: t.procedure
		.input(z.object({ note: z.string() }))
		.meta({ action: () => ({ note: { type: "textarea" } }) })
		.send(() => {}),
	events: t.procedure
		.autoPublish([], () => null)
		.request(function getEvents() {
			const events = Object.entries(router._def.procedures)
				// @ts-expect-error This does have the meta type
				.filter(([_, p]) => p._def.meta?.event)
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
	spawnEntity: t.procedure
		.meta({ action: true })
		.output(z.object({ id: z.number() }))
		.send(({ ctx }) => {
			const entity = new Entity();
			ctx.ecs.addEntity(entity);
			return { id: entity.id };
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
				entity.updateComponent(component, { [property]: value }, true);
			}
		}),
	/** Use this to fire events that can be responded to in timeline and trigger blocks */
	genericEvent: t.procedure
		.meta({ event: true })
		.input(
			z.object({
				clientId: z.string(),
				eventName: z.string(),
				properties: z.string(),
			}),
		)
		.output(
			z.object({
				clientId: z.string(),
				eventName: z.string(),
				properties: z.string(),
			}),
		)
		.send(({ input }) => input),
	pluginAssets: t.procedure
		.input(
			z
				.object({
					pluginId: z.string().optional(),
					extensions: z.string().array().optional(),
					aspect: z.object({ type: z.string(), aspectId: z.string() }).optional(),
				})
				.optional(),
		)
		.filter(() => true)
		.autoPublish([], () => null)
		.request(async ({ input, ctx }) => {
			const output: Record<
				string,
				{
					basePath: string;
					files: FileOrFolder[];
				}
			> = {};
			for (const plugin of ctx.server.plugins) {
				if (input?.pluginId && plugin.id !== input.pluginId) continue;
				const pluginPath = path.join("plugins", plugin.id, "assets");
				const assetUrl = (await plugin?.getAssetUrl()) || "";
				const basePath = path.join(assetUrl, pluginPath);
				output[plugin.id] = {
					basePath,
					files: await traverseFiles(basePath, assetUrl, input?.extensions),
				};

				const aspectType = (input?.aspect?.type || "") as keyof typeof plugin.aspects;
				if (aspectType in plugin.aspects) {
					const aspectObject = plugin.aspects[aspectType]?.find(
						(aspect) => aspect.name === input?.aspect?.aspectId,
					);
					if (aspectObject) {
						const basePath = path.join(assetUrl, "plugins", plugin.id, aspectObject.name, "assets");
						output[aspectObject.name] = {
							basePath,
							files: await traverseFiles(basePath, assetUrl, input?.extensions),
						};
					}
				}
			}

			// Now traverse the sorted files, remove the ones with no contents, sort them properly
			return output;
		}),
	uploadAsset: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				assetPath: z.string(),
				asset: z.instanceof(File),
			}),
		)
		.send(async ({ input, ctx }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const assetPath = await ctx.uploadFile.call(plugin, input.asset, input.assetPath);
			pubsub.publish.thorium.pluginAssets({});
			return { asset: assetPath };
		}),
	httpRequest: t.procedure
		.input(
			z.object({
				url: z.string(),
				method: z.enum(["get", "post", "put", "delete"]).default("get").optional(),
				headers: z.record(z.string()),
				responseType: z.enum(["text", "json", "ignore"]).default("text").optional(),
			}),
		)
		.meta({ action: true })
		.send(async ({ input }) => {
			const response = await fetch(input.url, { method: input.method, headers: input.headers });

			if (!response.ok) {
				throw new Error(
					`Error ${response.status} making ${input.method} HTTP request to ${input.url}: ${await response.text()}`,
				);
			}
			if (input.responseType === "text") {
				return { response: await response.text() };
			}
			if (input.responseType === "json") {
				return { response: await response.json() };
			}

			return { response: null };
		}),
	debug: t.procedure
		.meta({ action: true })
		.input(z.object({ message: z.string() }))
		.send(({ input }) => {
			console.debug(input.message);
		}),
	runCode: t.procedure
		.meta({ action: () => ({ code: { type: "textarea" } }) })
		.input(z.object({ code: z.string() }))
		.send(({ input, ctx }) => {
			return runInSandbox(input.code, ctx);
		}),
	eventsSub: t.procedure
		.filter((_: { name: string; values: any }) => true)
		.autoPublish([], () => null)
		.request(({ publish }) => {
			if (!publish) return null;
			return publish;
		}),
	actionsSub: t.procedure
		.filter((_: { name: string; values: any }) => true)
		.autoPublish([], () => null)
		.request(({ publish }) => {
			if (!publish) return null;
			return publish;
		}),
});
