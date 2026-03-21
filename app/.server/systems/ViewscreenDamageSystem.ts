import { type Entity, System } from "@thorium/utils/ecs";

/**
 * Syncs the parent "Viewscreens" system's damage state to each viewscreen's
 * damageBroken flag. All viewscreens on a ship share a single parent system
 * entity that owns the damage component.
 *
 * What breaks when damageBroken=true depends on brokenMode:
 * - fullyBroken: cameras + gizmos go down
 * - cameraBrokenOnly: only cameras go down, gizmos still work
 * - invincible: always damageBroken=false regardless of parent state
 */
export class ViewscreenDamageSystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return Boolean(entity.components.isViewscreen);
	}

	update(entity: Entity) {
		const vs = entity.components.isViewscreen;
		if (!vs) return;

		if (vs.brokenMode === "invincible") {
			if (vs.damageBroken) {
				entity.updateComponent("isViewscreen", { damageBroken: false }, true);
			}
			return;
		}

		const parentEntity = this.ecs.getEntityById(vs.viewscreenSystemId);
		const parentDamage = parentEntity?.components.damage;
		const shouldBeBroken = parentDamage?.offline ?? false;

		if (vs.damageBroken !== shouldBeBroken) {
			entity.updateComponent(
				"isViewscreen",
				{
					damageBroken: shouldBeBroken,
				},
				true,
			);
		}
	}
}
