import type { AllSends, SendInputs } from "@thorium/.server/init/router";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";

import { Entity, type ECS } from "../ecs";
import uniqid from "../uniqid";
import type { BlockMetadata } from "./executeBlocks";

/**
 * Use the ECS Timer System to schedule an action
 * to be performed at some later time. This is necessary
 * so delays can be serialized when the app shuts down
 * and are properly paused when the flight is paused.
 **/
export function scheduleAction<A extends AllSends>(
	ecs: ECS,
	action: A,
	inputs: SendInputs<A>,
	delay: number,
) {
	scheduleBlocks(ecs, [{ id: uniqid("act-"), type: "Action", action, values: inputs }], {}, delay);
}

/**
 * Use the ECS Timer System to schedule some blocks
 * to be performed at some later time. This is necessary
 * so delays can be serialized when the app shuts down
 * and are properly paused when the flight is paused.
 **/
export function scheduleBlocks(
	ecs: ECS,
	blocks: TimelineBlock[],
	blockMetadata: BlockMetadata,
	delay: number,
) {
	const entity = new Entity();
	entity.addComponent("timer", {
		paused: false,
		hidden: true,
		completeBlocks: blocks,
		blockMetadata,
		remainingDurationMs: delay,
	});
	ecs.addEntity(entity);

	return entity;
}
