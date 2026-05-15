import { PubSub } from "@thorium/utils/live-query/.server";

import type { router } from "./router";

export const pubsub = new PubSub<typeof router>();
