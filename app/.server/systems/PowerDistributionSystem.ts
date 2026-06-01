import { pubsub } from "@thorium/.server/init/pubsub";
import { systemPowerPriority } from "@thorium/cards/DamageReports/systemCategories";
import { type Entity, System } from "@thorium/utils/ecs";

export class PowerDistributionSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isShip;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;
		const systemIds = entity.components.shipSystems?.shipSystems.keys() || [];

		// Save a bunch of time by skipping this rigamarole for NPC ships
		if (!entity.components.isPlayerShip) {
			for (const sysId of systemIds) {
				const sys = this.ecs.getEntityById(sysId);
				if (sys?.components.power) {
					sys.updateComponent("power", { currentPower: sys.components.power.powerDraw });
				}
			}
			return;
		}

		const poweredSystems = new Map<number, Entity>();
		const reactors = new Map<number, Entity>();
		const batteries = new Map<number, Entity>();
		const batterySystems = new Map<number, Entity[]>();
		let wasSystemDeactivated = false;

		let individualReactorOutput = 0; // Calculate the power output of each reactor
		let powerBalanced = true;
		let grossReactorOutput = 0;
		for (const sysId of systemIds) {
			const sys = this.ecs.getEntityById(sysId);
			if (sys?.components.isReactor) {
				reactors.set(sys.id, sys);
				if (individualReactorOutput === 0) {
					individualReactorOutput = sys.components.isReactor.currentOutput;
				} else if (individualReactorOutput !== sys.components.isReactor.currentOutput) {
					powerBalanced = false;
				}
				grossReactorOutput += sys.components.isReactor.currentOutput;
			} else if (sys?.components.isBattery) batteries.set(sys.id, sys);
			else if (sys?.components.isShipSystem && sys.components.power) {
				if (sys.components.power.powerActivated) {
					poweredSystems.set(sys.id, sys);
				}
				if (sys.components.power.batterySource) {
					if (!batterySystems.has(sys.components.power.batterySource)) {
						batterySystems.set(sys.components.power.batterySource, []);
					}
					batterySystems.get(sys.components.power.batterySource)?.push(sys);
				}
				// Reset the power to this system
				sys.updateComponent("power", { currentPower: 0 });
			}
		}

		for (const [, reactor] of reactors) {
			reactor.updateComponent("isReactor", { balanced: powerBalanced });
		}

		// Reset all of the battery metrics and distribute battery power evenly to connected systems
		for (const [_, battery] of batteries) {
			if (!battery.components.isBattery) continue;
			battery.updateComponent("isBattery", {
				chargeAmount: 0,
				outputAmount: 0,
			});

			const systems = batterySystems.get(battery.id) || [];
			let totalOutput = systems.length === 0 ? 0 : battery.components.isBattery.outputRate;
			let outputAmount = 0;
			// Fill systems from least power draw to most power draw, updating the per system output as necessary
			const sortedSystems = systems.sort(
				(a, b) => (a.components.power?.powerDraw || 0) - (b.components.power?.powerDraw || 0),
			);
			let remainingSystems = sortedSystems.length || 1;
			for (const system of sortedSystems) {
				const perSystemOutput = totalOutput / remainingSystems;
				remainingSystems -= 1;
				const systemPowerInput = Math.min(
					perSystemOutput,
					system.components.power!.powerDraw,
					battery.components.isBattery.outputRate,
					battery.components.isBattery.storage / elapsedTimeHours,
				);
				totalOutput -= systemPowerInput;
				outputAmount += systemPowerInput;
				system.updateComponent("power", { currentPower: systemPowerInput });
			}
			battery.updateComponent("isBattery", {
				outputAmount,
			});
		}

		// Distribute power to all systems from the reactor
		// If the current power need is greater than the current power supply,
		// start chopping systems in priority order
		let hasEnoughPower = false;
		let insufficientPower = false;
		const poweredSystemsByPriority = Array.from(poweredSystems.values()).sort(
			(a, b) =>
				systemPowerPriority[a.components.isShipSystem!.type] -
				systemPowerPriority[b.components.isShipSystem!.type],
		);
		while (!hasEnoughPower) {
			const totalRequiredPower = poweredSystemsByPriority.reduce(
				(power, sys) =>
					power + sys.components.power!.powerDraw - sys.components.power!.currentPower,
				0,
			);
			if (totalRequiredPower === 0) break;
			if (totalRequiredPower <= grossReactorOutput) {
				hasEnoughPower = true;
				break;
			}
			insufficientPower = true;
			const ejectedSystem = poweredSystemsByPriority.pop();
			if (!ejectedSystem) break;
			ejectedSystem.updateComponent("power", { powerActivated: false });
			wasSystemDeactivated = true;
			poweredSystems.delete(ejectedSystem.id);
		}

		let netReactorOutput = 0;

		// Now we can confidently deliver power to all systems in the poweredSystems list
		for (const [_, sys] of poweredSystems) {
			sys.updateComponent("power", {
				currentPower: sys.components.power!.powerDraw,
			});
			netReactorOutput += sys.components.power!.powerDraw;
		}

		// If we ran out of power and had to turn off systems,
		//  we're going to say all of the extra power is tied up
		// and not use it to charge batteries.
		if (insufficientPower) {
			netReactorOutput = grossReactorOutput;
		}

		// Apply power to batteries from reactors and update the storage
		let surplusPower = grossReactorOutput - netReactorOutput;
		// Fill systems from least charge rate to most charge rate, updating the per battery input as necessary
		const sortedBatteries = Array.from(batteries.values()).sort(
			(a, b) =>
				(a.components.isBattery?.chargeRate || 0) - (b.components.isBattery?.chargeRate || 0),
		);
		let remainingBatteries = sortedBatteries.length || 1;
		for (const battery of sortedBatteries) {
			let perBatteryInput = surplusPower / remainingBatteries;
			remainingBatteries -= 1;
			const isBattery = battery.components.isBattery;
			if (!isBattery) continue;
			const { capacity, storage, chargeRate, outputAmount } = isBattery;
			if (storage >= capacity) {
				perBatteryInput = 0;
			}
			const storageInput = Math.min(chargeRate, perBatteryInput);
			battery.updateComponent("isBattery", {
				storage: Math.min(
					capacity,
					Math.max(0, storage + (storageInput - outputAmount) * elapsedTimeHours),
				),
				chargeAmount: storageInput,
			});
		}

		if (wasSystemDeactivated) {
			pubsub.publish.systemsMonitor.systems.get({ shipId: entity.id });
		}
	}
}
