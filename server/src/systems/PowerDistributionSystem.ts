import { reactor } from "@client/data/plugins/systems/reactor";
import { type Entity, System } from "@server/utils/ecs";

export class PowerDistributionSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isShip;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		const poweredSystems = new Map<number, Entity>();
		const reactors = new Map<number, Entity>();
		const batteries = new Map<number, Entity>();

		const systemIds = entity.components.shipSystems?.shipSystems.keys() || [];

		for (const sysId of systemIds) {
			const sys = this.ecs.getEntityById(sysId);
			if (sys?.components.isReactor) reactors.set(sys.id, sys);
			else if (sys?.components.isBattery) batteries.set(sys.id, sys);
			else if (sys?.components.isShipSystem && sys.components.power)
				poweredSystems.set(sys.id, sys);
		}

		// Reset all of the battery metrics
		batteries.forEach((battery) => {
			battery.updateComponent("isBattery", {
				chargeAmount: 0,
				outputAmount: 0,
			});
		});

		// Key is reactor/battery id, value is power supplied
		const powerSuppliedSources = new Map<number, number>();

		// Apply power to the systems from batteries and reactors
		for (const [id, system] of poweredSystems) {
			const power = system.components.power;
			if (!power) continue;
			const { powerDraw, powerSources } = power;
			let suppliedPower = 0;
			for (let i = 0; i < powerDraw; i++) {
				const source = powerSources[i];
				if (typeof source === "number") {
					const sourceEntity = this.ecs.getEntityById(source);
					if (sourceEntity?.components.isBattery?.storage === 0) continue;
					suppliedPower++;
					powerSuppliedSources.set(
						source,
						(powerSuppliedSources.get(source) || 0) + 1,
					);
				}
			}
			system.updateComponent("power", { currentPower: suppliedPower });
		}
		// Apply power to batteries from reactors
		for (const [id, battery] of batteries) {
			const isBattery = battery.components.isBattery;
			if (!isBattery) continue;
			let suppliedPower = 0;
			for (const source of isBattery.powerSources) {
				suppliedPower++;
				powerSuppliedSources.set(
					source,
					(powerSuppliedSources.get(source) || 0) + 1,
				);
			}
			const outputAmount = powerSuppliedSources.get(battery.id) || 0;
			const storage = isBattery.storage;
			const storageAdjustment = suppliedPower - outputAmount;
			const newStorage = Math.min(
				Math.max(storage + storageAdjustment * elapsedTimeHours, 0),
				isBattery.capacity,
			);
			battery.updateComponent("isBattery", {
				chargeAmount: suppliedPower,
				outputAmount,
				storage: newStorage,
			});
		}

		// Update the reactor metrics
		for (const [id, reactor] of reactors) {
			const powerSupplied = powerSuppliedSources.get(reactor.id) || 0;
			reactor.updateComponent("isReactor", {
				currentOutput: powerSupplied,
			});
		}
	}
}
