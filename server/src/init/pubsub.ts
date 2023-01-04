import {PubSub} from "@thorium/live-query/server";
import {router} from "./router";

export const pubsub = new PubSub<typeof router>();
