import type { isLongRangeMessage } from "@thorium/ecs-components/shipSystems";
import type z from "zod";

export class CoreComposeLongRangeMessageEvent extends Event {
	static name = "core-compose-long-range-message";
	constructor(public senderId: number) {
		super(CoreComposeLongRangeMessageEvent.name);
	}
}

export const lrmStateMap: Record<
	z.infer<typeof isLongRangeMessage>["state"],
	string
> = {
	deleted: "Deleted",
	delivered: "Delivered",
	failing: "Failing",
	intercepted: "Intercepted",
	pending: "Pending",
	sending: "Sending",
	undelivered: "Undelivered",
};
