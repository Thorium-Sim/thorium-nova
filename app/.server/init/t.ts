import type { Entity } from "@thorium/utils/ecs";
import type { Context } from "./liveQuery";
import { initLiveQuery } from "@thorium/utils/live-query/.server";

export const t = initLiveQuery
	.dataStreamEntity<Entity>()
	.context<Context>()
	.create();
