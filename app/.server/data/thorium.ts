import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { t } from "@thorium/.server/init/t";
import { actionItem } from "@thorium/utils/flags/actionSchema";
import { selectValueQuery } from "@thorium/utils/.server/evaluateEntityQuery";
import { triggerAction } from "@thorium/utils/.server/triggerAction";
import { capitalCase } from "change-case";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import path from "node:path";
import { getPlugin } from "@thorium/.server/data/plugins/utils";
import { traverseFiles } from "@thorium/.server/data/traverseFiles";

export type ActionOverrides = {
	name?: string;
	type?: string;
	values?: string[];
	helper?: string;
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
					triggerAction(action.action, action.values, ctx),
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
				entity.updateComponent(component, { [property]: value }, true);
			}
		}),
	pluginAssets: t.procedure
		.input(
			z
				.object({
					pluginId: z.string().optional(),
					extensions: z.string().array().optional(),
					aspect: z
						.object({ type: z.string(), aspectId: z.string() })
						.optional(),
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

				const aspectType = (input?.aspect?.type ||
					"") as keyof typeof plugin.aspects;
				if (aspectType in plugin.aspects) {
					const aspectObject = plugin.aspects[aspectType]?.find(
						(aspect) => aspect.name === input?.aspect?.aspectId,
					);
					if (aspectObject) {
						const basePath = path.join(
							assetUrl,
							"plugins",
							plugin.id,
							aspectObject.name,
							"assets",
						);
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
			const assetPath = await ctx.uploadFile.call(
				plugin,
				input.asset,
				input.assetPath,
			);
			pubsub.publish.thorium.pluginAssets({});
			return { asset: assetPath };
		}),
	debug: t.procedure
		.meta({ action: true })
		.input(z.object({ message: z.string() }))
		.send(({ input }) => {
			console.debug(input.message);
		}),
});
