import { pubsub } from "@thorium/.server/init/pubsub";
import { cancelLoopingSound } from "@thorium/utils/.server/playRangedSound";
import { type Entity, System } from "@thorium/utils/ecs";

/**
 * Loads and unloads torpedoes
 */
export class TorpedoLoadingSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(entity.components.isTorpedoLauncher && entity.components.isShipSystem);
	}
	update(entity: Entity, deltaTime: number) {
		const component = entity.components.isTorpedoLauncher;
		if (!component) return;
		let { status, progress, firingEnergy, torpedoEntity } = component;

		// Decrease the deltaTime based on how well the power to the torpedoes is satisfied.
		let adjustedTime = deltaTime;
		if (entity.components.power) {
			const { currentPower, powerLevels } = entity.components.power || {};

			const requiredPower = powerLevels[0];
			if (currentPower < requiredPower) adjustedTime = 0;
			if (status === "firing") {
				firingEnergy += currentPower * (deltaTime / 1000);
			}
		}

		if (
			status === "loading" ||
			status === "unloading" ||
			status === "firing" ||
			status === "fired"
		) {
			progress -= adjustedTime;
			if (status === "firing" && progress > 0) {
				const torpedo = this.ecs.getEntityById(torpedoEntity || -1);
				if (!torpedo) return;
				const requiredFiringEnergy =
					torpedo.components.isInventory?.flags.torpedoCasing?.requiredLaunchEnergyMWs || 0;
				if (firingEnergy >= requiredFiringEnergy) {
					cancelLoopingSound(entity, "unload");
					cancelLoopingSound(entity, "load");
					cancelLoopingSound(entity, "fire");
					cancelLoopingSound(entity, "firingPowerUp");
					this.ecs.triggerAction("targeting.torpedoes.fired", { launcherId: entity.id });
				} else {
					entity.updateComponent("isTorpedoLauncher", { status, progress, firingEnergy });
				}
			} else if (progress <= 0) {
				progress = 0;
				if (status === "loading") {
					status = "loaded";
				} else if (status === "unloading" || status === "fired") {
					status = "ready";
				} else if (status === "firing") {
					// This means the torpedo failed to fire because it had insufficient energy. Back to loaded,
					// and try to notify the station
					status = "loaded";
					firingEnergy = 0;
					if (component.firedClientId)
						this.ecs.triggerAction("effects.notify", {
							clientName: component.firedClientId,
							color: "error",
							shipId: entity.components.isShipSystem?.shipId || -1,
							title: "Failed to Fire",
							body: "Insufficient Power",
							cards: ["Targeting"],
						});
				}

				// Cancel any sounds the torpedo launcher might be looping
				cancelLoopingSound(entity, "unload");
				cancelLoopingSound(entity, "load");
				cancelLoopingSound(entity, "fire");
				cancelLoopingSound(entity, "firingPowerUp");

				entity.updateComponent("isTorpedoLauncher", {
					status,
					progress,
					firingEnergy: 0,
					...(status === "ready" ? { torpedoEntity: null } : {}),
				});
				pubsub.publish.targeting.torpedoes.launchers({
					shipId: entity.components.isShipSystem?.shipId || 0,
				});
			} else {
				entity.updateComponent("isTorpedoLauncher", { status, progress, firingEnergy });
			}
		}
	}
}
