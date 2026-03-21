import type { isLongRangeMessage } from "@thorium/ecs-components/shipSystems";
import type z from "zod";

export class CoreLongRangeMessageSenderEvent extends Event {
	static name = "core-long-range-message-sender";
	constructor(public senderId: number) {
		super(CoreLongRangeMessageSenderEvent.name);
	}
}
export class CoreLongRangeMessagePickSenderEvent extends Event {
	static name = "core-long-range-message-pick-sender";
	constructor() {
		super(CoreLongRangeMessagePickSenderEvent.name);
	}
}

export class CoreLongRangeMessageDestinationEvent extends Event {
	static name = "core-long-range-message-destination";
	constructor(public destinationId: number) {
		super(CoreLongRangeMessageDestinationEvent.name);
	}
}

export class CoreLongRangeMessagePickDestinationEvent extends Event {
	static name = "core-long-range-message-pick-destination";
	constructor() {
		super(CoreLongRangeMessagePickDestinationEvent.name);
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
	read: "Read",
};

export const rotateCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
export const replaceCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
