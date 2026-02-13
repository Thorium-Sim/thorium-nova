import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { type Entity, System } from "@thorium/utils/ecs";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";
import { Vector3 } from "three";

export class DamageCheckSystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return Boolean(entity.components.isShipSystem);
	}

	update(entity: Entity, elapsed: number) {
		const damageComponent = entity.components.damage;

		// If a component is online, check if it should be taken offline
		if (damageComponent) {
			const aggregateDamage = getAggregateDamage(entity);
			if (damageComponent.offline) {
				if (damageComponent.onlineDamage < aggregateDamage) {
					return;
				}
				// Bring the system back online
				damageComponent.offline = false;
			} else {
				if (damageComponent.offlineDamage > aggregateDamage) {
					return;
				}
				damageComponent.offline = true;

				this.checkIfCascadeOccurs(entity, elapsed);
			}
		}
	}

	// Check if a cascade event occurs when a system goes offline; if so, apply damage to a random system
	checkIfCascadeOccurs(entity: Entity, elapsed: number) {
		const damageComponent = entity.components.damage;
		if (damageComponent) {
			const cascadeRisk = damageComponent.cascadeRisk || 0;
			// Cascade risk is expressed as a percentage
			if (cascadeRisk > 0) {
				const randomRoll = this.ecs.rng.next() * 100;
				if (randomRoll < cascadeRisk * elapsed) {
					// Damage a random system
					const randomVector = new Vector3();
					const damageAmount = damageComponent.offlineDamage;
					applyDamage(entity, damageAmount, randomVector, undefined, false);
				}
			}
		}
	}
}
