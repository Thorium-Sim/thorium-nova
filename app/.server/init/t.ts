import type { Entity } from "@thorium/utils/ecs";
import { initLiveQuery } from "@thorium/utils/live-query/.server";

import type { Context } from "./liveQuery";

export const t = initLiveQuery.dataStreamEntity<Entity>().context<Context>().create();
