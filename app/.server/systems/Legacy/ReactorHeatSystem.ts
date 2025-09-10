import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { type Entity, System } from "@thorium/utils/ecs";

export class LegacyReactorHeatSystem extends System {
	static flightMode = ["legacy"];
	shipSystemPower = new Map<number, number>();
	shipReactorPower = new Map<number, number>();
	test(entity: Entity) {
		return !!entity.components.isReactor;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const { isReactor, heat: heatComp, damage } = entity.components;

		if (!isReactor || !heatComp || !damage) return;

		const { efficiency } = damage;
		const { externalPower } = isReactor;
		const { heat, maxHeat, nominalHeat, legacyHeatRate } = heatComp;

		const heatAdjustment = maxHeat - nominalHeat;
		if (externalPower) {
			entity.updateComponent("heat", {
				heat: heat - 0.005 * heatAdjustment * elapsedRatio,
			});
			return;
		}

		const ship = this.ecs.getEntityById(
			entity.components.isShipSystem?.shipId || -1,
		);
		if (!ship) return;
		if (!this.shipSystemPower.has(ship.id)) {
			this.shipSystemPower.set(ship.id, 0);
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = this.ecs.getEntityById(systemId);
				this.shipSystemPower.set(
					ship.id,
					(this.shipSystemPower.get(ship.id) || 0) +
						(system?.components.power?.currentPower || 0),
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
							(reactor.components.damage?.efficiency || 0),
				);
			}
		}

		const minute30 = 30 * 60;
		const standardHeat = efficiency ** 2 / minute30;
		const unblanaceHeat =
			Math.abs(
				Math.cbrt(
					(this.shipReactorPower.get(ship.id) || 0) -
						(this.shipSystemPower.get(ship.id) || 0),
				),
			) / 5000;

		entity.updateComponent("heat", {
			heat:
				heat +
				(standardHeat + unblanaceHeat) *
					legacyHeatRate *
					heatAdjustment *
					elapsedRatio,
		});
	}

	postUpdate() {
		this.shipReactorPower.clear();
		this.shipSystemPower.clear();
	}
}
