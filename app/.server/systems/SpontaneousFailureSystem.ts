import {applyDamage, applySystemDamage} from "@thorium/utils/.server/ship/collisionDamage";
import { type Entity, System } from "@thorium/utils/ecs";
import {getAggregateDamage} from "@thorium/utils/flags/damageTypes";
import {Vector3} from "three";

export class SpontaneousFailureSystem extends System {
  static flightMode = ["nova"];

  test(entity: Entity) {
    return Boolean(entity.components.isPlayerShip);
  }

  update(entity: Entity, _elapsed: number) {
    const damageComponent = entity.components.damage;

    // If a component is online, check if it should be taken offline
    if (damageComponent && !damageComponent.offline) {
      const spontaneousFailureChance = damageComponent.failureRisk || 0;
      // Spontaneous failure chance is expressed as a percentage
      if (spontaneousFailureChance > 0) {
        const randomRoll = this.ecs.rng.nextAsPercentage();
        if (randomRoll < spontaneousFailureChance) {
          const currentDamage = getAggregateDamage(entity);
          const damageNeededToGoOffline = damageComponent.offlineDamage - currentDamage;
          // Add a random amount of damage to possibly damage the system more than needed
          const randomExtraDamage = this.ecs.rng.nextAsPercentage() * damageComponent.offlineDamage * 0.1;
          // Take the system offline
          applySystemDamage(entity, damageNeededToGoOffline + randomExtraDamage);
        }
      }
    }
  }
}
