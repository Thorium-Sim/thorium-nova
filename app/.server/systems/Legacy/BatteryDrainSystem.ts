import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { type Entity, System } from "@thorium/utils/ecs";

export class LegacyBatteryDrainSystem extends System {
	static flightMode = ["legacy"];
	shipSystemPower = new Map<number, number>();
	shipReactorPower = new Map<number, number>();
	test(entity: Entity) {
		return !!entity.components.isBattery;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const isBattery = entity.components.isBattery;

		if (!isBattery || entity.components.isPhaseCapacitor) return;

		const { chargeRate, capacity, storage } = isBattery;
		const ship = this.ecs.getEntityById(entity.components.isShipSystem?.shipId || -1);
		if (!ship) return;
		if (!this.shipSystemPower.has(ship.id)) {
			this.shipSystemPower.set(ship.id, 0);
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() || []) {
				const system = this.ecs.getEntityById(systemId);
				this.shipSystemPower.set(
					ship.id,
					(this.shipSystemPower.get(ship.id) || 0) + (system?.components.power?.currentPower || 0),
				);
			}
		}
		if (!this.shipReactorPower.has(ship.id)) {
			this.shipReactorPower.set(ship.id, 0);
			for (const reactor of getShipSystems(this.ecs, {
				systemType: "reactor",
				shipId: ship.id,
			})) {
				this.shipReactorPower.set(
					ship.id,
					(this.shipReactorPower.get(ship.id) || 0) +
						(reactor.components.isReactor?.maxOutput || 0) *
							(reactor.components.damage?.efficiency || 0) *
							(reactor.components.damage?.offline ? 0 : 1),
				);
			}
		}
		const level =
			(this.shipSystemPower.get(ship.id) || 0) - (this.shipReactorPower.get(ship.id) || 0);

		//Reduce the batteries by the amount left over
		//Each battery takes the remaining load evenly
		//If level is a negative number, charge the batteries
		const charge = level * (chargeRate / 40 / 1000) * elapsedRatio;
		const newLevel = Math.min(capacity, Math.max(0, storage - charge));
		entity.updateComponent("isBattery", { storage: newLevel });
	}
	postUpdate(_elapsed: number): void {
		this.shipReactorPower.clear();
		this.shipSystemPower.clear();
	}
}
