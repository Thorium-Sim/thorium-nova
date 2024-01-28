import type {Entity} from "@server/utils/ecs";
import type {Context} from "./liveQuery";
import {initLiveQuery} from "@thorium/live-query/server";

export const t = initLiveQuery
  .dataStreamEntity<Entity>()
  .context<Context>()
  .create();
