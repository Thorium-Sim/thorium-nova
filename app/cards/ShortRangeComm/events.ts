import type { isShortRangeComm } from "@thorium/ecs-components/shipSystems";
import type z from "zod";

export class CoreShortRangeHailerEvent extends Event {
	static name = "core-short-range-hailer";
	constructor(public hailerId: number) {
		super(CoreShortRangeHailerEvent.name);
	}
}
export class CoreShortRangePickHailerEvent extends Event {
	static name = "core-short-range-pick-hailer";
	constructor() {
		super(CoreShortRangePickHailerEvent.name);
	}
}

export class CoreShortRangeTargetEvent extends Event {
	static name = "core-short-range-target";
	constructor(public targetId: number) {
		super(CoreShortRangeTargetEvent.name);
	}
}

export class CoreShortRangePickTargetEvent extends Event {
	static name = "core-short-range-pick-target";
	constructor() {
		super(CoreShortRangePickTargetEvent.name);
	}
}

export const shortRangeStateMap: Record<
	z.infer<typeof isShortRangeComm>["state"],
	string
> = {
	connected: "Connected",
	hailing: "Hailing",
	idle: "Idle",
};
