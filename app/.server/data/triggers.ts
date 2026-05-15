import { t } from "@thorium/.server/init/t";
import { spawnTrigger } from "@thorium/.server/spawners/trigger";
import { isTrigger } from "@thorium/ecs-components/isTrigger";
import z from "zod";

export const triggers = t.router({
	create: t.procedure
		.meta({
			action: true,
			inputs: ["name", "tags"],
		})
		.input(
			isTrigger.removeDefault().extend({
				name: z.string().describe("Trigger Name"),
				tags: z.array(z.string()).default([]),
			}),
		)
		.send(async ({ ctx, input }) => {
			const { name, tags, ...trigger } = input;
			const entity = spawnTrigger({ name, tags, trigger });
			ctx.flight?.ecs.addEntity(entity);

			return { triggerId: entity.id };
		}),
});
