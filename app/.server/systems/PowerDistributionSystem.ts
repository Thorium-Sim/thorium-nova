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

		// First distribute power from reactors
		let netReactorOutput = 0;

		const poweredSystemsByPriority = Array.from(poweredSystems.values()).sort(
			(a, b) =>
				systemPowerPriority[a.components.isShipSystem!.type] -
				systemPowerPriority[b.components.isShipSystem!.type],
		);

		for (const sys of poweredSystemsByPriority) {
			const totalAvailablePower = grossReactorOutput - netReactorOutput;
			if (totalAvailablePower <= 0) break;
			const powerDraw = sys.components.power?.powerDraw || 0;
			const currentPower = Math.min(totalAvailablePower, powerDraw);
			sys.updateComponent("power", { currentPower });
			netReactorOutput += currentPower;
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
			// Fill systems from least remaining power draw to most remaining power draw, updating the per system output as necessary
			const sortedSystems = systems.sort((a, b) => {
				const aRemainingPowerDraw =
					(a.components.power?.powerDraw || 0) - (a.components.power?.currentPower || 0);
				const bRemainingPowerDraw =
					(b.components.power?.powerDraw || 0) - (b.components.power?.currentPower || 0);
				return aRemainingPowerDraw - bRemainingPowerDraw;
			});
			let remainingSystems = sortedSystems.length || 1;
			for (const system of sortedSystems) {
				const perSystemOutput = totalOutput / remainingSystems;
				remainingSystems -= 1;
				const currentPower = system.components.power!.currentPower;
				const systemPowerInput = Math.min(
					perSystemOutput,
					system.components.power!.powerDraw - currentPower,
					battery.components.isBattery.outputRate,
					battery.components.isBattery.storage / elapsedTimeHours,
				);
				totalOutput -= systemPowerInput;
				outputAmount += systemPowerInput;
				system.updateComponent("power", { currentPower: currentPower + systemPowerInput });
			}
			battery.updateComponent("isBattery", {
				outputAmount,
			});
		}

		// Apply power to batteries from reactors and update the storage
		let surplusPower = grossReactorOutput - netReactorOutput;

		// Fill batteries from least charge rate to most charge rate, updating the per battery input as necessary
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
			const { capacity, storage, chargeRate, outputAmount, powerActivated } = isBattery;
			if (storage >= capacity || !powerActivated) {
				perBatteryInput = 0;
			}
			let storageInput = Math.min(chargeRate, perBatteryInput);
			battery.updateComponent("isBattery", {
				storage: Math.min(
					capacity,
					Math.max(0, storage + (storageInput - outputAmount) * elapsedTimeHours),
				),
				chargeAmount: storageInput,
			});
		}
	}
}
