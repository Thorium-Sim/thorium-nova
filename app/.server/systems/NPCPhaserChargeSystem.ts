import { System, type Entity } from "@thorium/utils/ecs";

/** Used for charging NPC phasers without too much processing */
export class NPCPhaserChargeSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isShip && !entity.components.isPlayerShip;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedHours = elapsed / (1000 / this.frequency) / 3600;
		const alertLevel = entity.components.isShip?.alertLevel;
		if (alertLevel === "1" || alertLevel === "2") {
			for (const [id] of entity.components.shipSystems?.shipSystems || []) {
				const sys = this.ecs.getEntityById(id);
				if (sys?.components.isPhaseCapacitor) {
					const {
						capacity = 0,
						chargeRate = 0,
						storage = 0,
					} = sys.components.isBattery || {};
					const newCharge = Math.min(
						capacity,
						storage + chargeRate * elapsedHours,
					);
					sys.updateComponent("isBattery", { storage: newCharge });
				}
			}
		}
	}
}
