import { pubsub } from "@server/init/pubsub";
import { type Entity, System } from "../utils/ecs";

/**
 * Loads and unloads torpedoes
 */
export class TorpedoLoadingSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isTorpedoLauncher && entity.components.isShipSystem
		);
	}
	update(entity: Entity, deltaTime: number) {
		const component = entity.components.isTorpedoLauncher;
		if (!component) return;

		// Decrease the deltaTime based on how well the power to the torpedoes is satisfied.
		let adjustedTime = deltaTime;
		if (entity.components.power) {
			const { currentPower, maxSafePower, requiredPower } =
				entity.components.power || {};
			adjustedTime =
				deltaTime +
				deltaTime *
					(Math.max(0, currentPower - requiredPower) /
						(maxSafePower - requiredPower));
		}

		let { status, progress } = component;
		if (status === "loading" || status === "unloading" || status === "firing") {
			progress -= adjustedTime;
			if (progress <= 0) {
				progress = 0;
				if (status === "loading") {
					status = "loaded";
				} else if (status === "unloading") {
					status = "ready";
				} else if (status === "firing") {
					status = "ready";
				}
				entity.updateComponent("isTorpedoLauncher", {
					status,
					progress,
					...(status === "ready" ? { torpedoEntity: null } : {}),
				});
				pubsub.publish.targeting.torpedoes.launchers({
					shipId: entity.components.isShipSystem?.shipId || 0,
				});
			} else {
				entity.updateComponent("isTorpedoLauncher", { status, progress });
			}
		}
	}
}
