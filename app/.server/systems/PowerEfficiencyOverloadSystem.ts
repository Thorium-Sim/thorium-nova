import {
	applyDamage,
	applySystemDamage,
} from "@thorium/utils/.server/ship/collisionDamage";
import { type Entity, System } from "@thorium/utils/ecs";

export class PowerEfficiencyOverloadSystem extends System {
	test(entity: Entity) {
		return Boolean(entity.components.damage && entity.components.power);
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;

		const power = entity.components.power;
		const damage = entity.components.damage;
		if (!power || !damage) return;

		const entropy = Math.abs(this.ecs.rng.next()) * damage.entropyMultiplier;
		const overloadPercent = Math.max(
			0,
			(power.currentPower - power.maxSafePower) / power.maxSafePower,
		);
		const overloadDecrease =
			(overloadPercent * damage.overloadDamageMultiplier + entropy) *
			elapsedRatio;
		applySystemDamage(entity, overloadDecrease, ["Fatigue"]);
	}
}
