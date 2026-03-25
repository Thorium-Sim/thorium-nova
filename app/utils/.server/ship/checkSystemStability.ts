import type { Entity } from "@thorium/utils/ecs";
import { SystemStabilityError } from "@thorium/utils/live-query/client/SystemStabilityError";
/**
 * Check if a command to a system failed because of system instability.
 * @param systemEntity
 * @throws SystemStabilityError if the rng returns a number less than the instability value of the system
 * @example Assuming systemEntity.instability is 0.5
 * ```TypeScript
 * checkSystemStability(systemEntity); // 50% chance to throw SystemStabilityError
 * ```
 */
export function checkSystemStability(systemEntity: Entity): void {
	const instability = systemEntity.components.damage?.instability ?? 0;
	if (instability <= 0) return;
	const roll = systemEntity.ecs.rng.nextAsPercentage();
	console.log(roll);
	if (roll < instability) {
		throw new SystemStabilityError(
			"System instability caused the command to fail. Please try again.",
		);
	}
}
