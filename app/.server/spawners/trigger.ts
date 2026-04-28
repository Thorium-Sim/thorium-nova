import type { isTrigger } from "@thorium/ecs-components/isTrigger";
import { Entity } from "@thorium/utils/ecs";
import type z from "zod";

export function spawnTrigger({
	name,
	trigger,
	tags,
}: {
	name?: string;
	trigger: z.infer<typeof isTrigger>;
	tags?: string[];
}) {
	const entity = new Entity();
	entity.addComponent("isTrigger", trigger);
	if (name) {
		entity.addComponent("identity", { name });
	}
	if (tags) {
		entity.addComponent("tags", { tags });
	}

	return entity;
}
