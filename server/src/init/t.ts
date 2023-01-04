import type {Entity} from "@server/utils/ecs";
import {initLiveQuery} from "@thorium/live-query/server";
import type {Context} from "./liveQuery";

export const t = initLiveQuery
  .dataStreamEntity<Entity>()
  .context<Context>()
  .create();
