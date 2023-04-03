import {pubsub} from "@server/init/pubsub";
import {Entity, System} from "@server/utils/ecs";

export class PowerEfficiencyOverloadSystem extends System {
  test(entity: Entity) {
    return Boolean(entity.components.efficiency && entity.components.power);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const power = entity.components.power;
    const efficiency = entity.components.efficiency;
    if (!power || !efficiency) return;

    // A very small random efficiency drop every frame
    let entropy = Math.abs(this.ecs.rng.next()) * efficiency.entropyMultiplier;
    const overloadPercent = Math.max(
      0,
      (power.currentPower - power.maxSafePower) / power.maxSafePower
    );
    const overloadDecrease =
      (overloadPercent * efficiency.multiplier + entropy) * elapsedRatio;
    entity.updateComponent("efficiency", {
      efficiency: Math.max(0, efficiency.efficiency - overloadDecrease),
    });
  }
}
