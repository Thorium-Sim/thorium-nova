import { reactor } from "@client/data/plugins/systems/reactor";
import { type Entity, System } from "@server/utils/ecs";

export class PowerDistributionSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isShip;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		const poweredSystems: Entity[] = [];
		const reactors: Entity[] = [];
		const batteries: Entity[] = [];

		const systemIds = entity.components.shipSystems?.shipSystems.keys() || [];

		for (const sysId of systemIds) {
			const sys = this.ecs.getEntityById(sysId);
			if (sys?.components.isReactor) reactors.push(sys);
			else if (sys?.components.isBattery) batteries.push(sys);
			else if (sys?.components.isShipSystem && sys.components.power)
				poweredSystems.push(sys);
		}

		// Reset all of the battery metrics
		batteries.forEach((battery) => {
			battery.updateComponent("isBattery", {
				chargeAmount: 0,
				outputAmount: 0,
			});
		});

		// Key is systemId, value is array of reactor/battery IDs
		const reactorPowerAssignment = new Map<number, number[]>();
		const batteryPowerAssignment = new Map<number, number[]>();

		// Pass power from reactors to batteries and systems
		for (const reactor of reactors) {
			// Each assignment is one unit of power applied to that system or battery
			for (const systemId of reactor.components.isReactor?.outputAssignment ||
				[]) {
				reactorPowerAssignment.set(systemId, [
					...(reactorPowerAssignment.get(systemId) || []),
					reactor.id,
				]);
			}
		}

		// Key is reactor/battery ID, value is power supplied
		const reactorPowerSupplied = new Map<number, number>();
		const batteryPowerSupplied = new Map<number, number>();

		// Apply power from reactors, then do the same thing with batteries
		for (const battery of batteries) {
			// Charge the battery from the Reactors
			const storage = battery.components.isBattery?.storage || 0;
			const capacity = battery.components.isBattery?.capacity || 0;
			const chargeRate =
				battery.components.isBattery?.chargeRate || Number.POSITIVE_INFINITY;
			const batteryPowerSupply = reactorPowerAssignment.get(battery.id) || [];

			let suppliedPower = 0;
			for (let i = 0; i < chargeRate; i++) {
				if (batteryPowerSupply.length === 0) break;
				const reactorId = batteryPowerSupply.pop();
				if (!reactorId) break;
				reactorPowerSupplied.set(
					reactorId,
					(reactorPowerSupplied.get(reactorId) || 0) + 1,
				);
				suppliedPower += 1;
			}

			const chargeAmount = storage === capacity ? 0 : suppliedPower;
			battery.updateComponent("isBattery", {
				chargeAmount,
				storage: Math.min(storage + chargeAmount * elapsedTimeHours, capacity),
			});

			// Output battery power to systems
			if (battery.components.isBattery?.discharging) {
				// How many points of power
				let maxOutput = battery.components.isBattery.storage / elapsedTimeHours;
				// Each assignment is one unit of power applied to that system or battery
				for (const systemId of battery.components.isBattery?.outputAssignment ||
					[]) {
					if (maxOutput <= 0) {
						break;
					}
					batteryPowerAssignment.set(systemId, [
						...(batteryPowerAssignment.get(systemId) || []),
						battery.id,
					]);
					maxOutput -= 1;
				}
			}
		}

		// Apply power to systems, first from reactors, then from batteries
		for (const system of poweredSystems) {
			const powerDraw = system.components.power?.powerDraw || 0;
			let suppliedPower = 0;
			for (let i = 0; i < powerDraw; i++) {
				const reactorId = reactorPowerAssignment.get(system.id)?.pop();
				if (reactorId) {
					reactorPowerSupplied.set(
						reactorId,
						(reactorPowerSupplied.get(reactorId) || 0) + 1,
					);
					suppliedPower += 1;
					continue;
				}
				const batteryId = batteryPowerAssignment.get(system.id)?.pop();
				if (batteryId) {
					const battery = this.ecs.getEntityById(batteryId);
					batteryPowerSupplied.set(
						batteryId,
						(batteryPowerSupplied.get(batteryId) || 0) + 1,
					);
					suppliedPower += 1;
					continue;
				}
				break;
			}
			system.updateComponent("power", { currentPower: suppliedPower });
		}

		// Update the reactor and battery components with the power supplied
		for (const reactor of reactors) {
			reactor.updateComponent("isReactor", {
				currentOutput: reactorPowerSupplied.get(reactor.id) || 0,
			});
		}
		for (const battery of batteries) {
			const storage = battery.components.isBattery?.storage || 0;
			battery.updateComponent("isBattery", {
				outputAmount: batteryPowerSupplied.get(battery.id) || 0,
				storage: Math.max(
					0,
					storage -
						(batteryPowerSupplied.get(battery.id) || 0) * elapsedTimeHours,
				),
			});
		}
	}
}
