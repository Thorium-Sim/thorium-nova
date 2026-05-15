import type { isLongRangeMessage } from "@thorium/ecs-components/shipSystems";
import type z from "zod";

export const lrmStateMap: Record<z.infer<typeof isLongRangeMessage>["state"], string> = {
	deleted: "Deleted",
	delivered: "Delivered",
	failing: "Failing",
	intercepted: "Intercepted",
	pending: "Pending",
	sending: "Sending",
	undelivered: "Undelivered",
	read: "Read",
};

export const rotateCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
export const replaceCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
