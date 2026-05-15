import type { Entity } from "@thorium/utils/ecs";
import { SystemStabilityError } from "@thorium/utils/live-query/client/client";

/**
 * Check if a command to a system failed because of system instability.
 * @param systemEntity
 * @param title the title to show in the toast
 * @throws LiveQueryError if the rng returns a number less than the instability value of the system
 * @example Assuming systemEntity.instability is 0.5
 * ```TypeScript
 * checkSystemStability(systemEntity); // 50% chance to throw LiveQueryError
 * ```
 */
export function checkSystemStability(systemEntity: Entity, title: string): void {
	const instability = systemEntity.components.damage?.instability ?? 0;
	if (instability <= 0) return;
	const roll = systemEntity.ecs.rng.nextAsPercentage();
	if (roll < instability) {
		throw new SystemStabilityError(
			"System instability caused the command to fail. Please try again.",
			title,
		);
	}
}
