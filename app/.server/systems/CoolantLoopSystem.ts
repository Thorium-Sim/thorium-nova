import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { Entity, System } from "@thorium/utils/ecs";
import { StephanBoltzmannConstant } from "@thorium/utils/unitTypes";

export class CoolantLoopSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isShip;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedSeconds = elapsed / 1000;
		// If any of these entities aren't present, we'll just use the default values
		let coolantPump: Entity | null = null;
		let coolantRadiator: Entity | null = null;
		let coolantReservoir: Entity | null = null;
		try {
			coolantPump = getShipSystem(this.ecs, { systemType: "coolantPump", shipId: entity.id });
			coolantRadiator = getShipSystem(this.ecs, {
				systemType: "coolantRadiator",
				shipId: entity.id,
			});
			coolantReservoir = getShipSystem(this.ecs, {
				systemType: "coolantTank",
				shipId: entity.id,
			});
		} catch {}

		const systems: Entity[] = [];
		for (const id of entity.components.shipSystems?.shipSystems.keys() || []) {
			const sys = this.ecs.getEntityById(id);
			if (
				sys &&
				sys.components.heat &&
				!sys.components.isCoolantRadiator &&
				!sys.components.isCoolantTank &&
				!sys.components.isCoolantPump
			)
				systems.push(sys);
		}

		// Collect all of the necessary constants
		const baseFlowRate = (coolantPump?.components.isCoolantPump?.baseFlowRate || 40000) / 60; // Convert to seconds
		// Actual flow rate is based on the power supplied to the pump, which physically is based on a cube root
		const pumpMinPower = coolantPump?.components.power?.powerLevels[0] ?? 1;
		const pumpCurrentPower = coolantPump?.components.power?.currentPower ?? 1;
		const flowRate = baseFlowRate * (pumpCurrentPower / pumpMinPower) ** (1 / 3);

		const coolantDensity = coolantReservoir?.components.isCoolantTank?.coolantDensity || 1113.2;
		const coolantSpecificHeat =
			coolantReservoir?.components.isCoolantTank?.coolantSpecificHeat || 2.42;
		const reservoirVolume = coolantReservoir?.components.heat?.coolantVolume || 1000;
		const radiatorVolume = coolantRadiator?.components.heat?.coolantVolume || 100;
		const reservoirTemperature = coolantReservoir?.components.heat?.heat || 200;
		const radiatorTemperature = coolantRadiator?.components.heat?.heat || 200;
		const radiatorArea = coolantRadiator?.components.isCoolantRadiator!.area || 1;
		const radiatorInCoolantLoop = coolantRadiator?.components.heat?.inCoolantLoop ?? true;

		// Derived Values
		const radiatorCoolantMass = radiatorVolume * coolantDensity;
		const heatTransferReservoir = flowRate ? (reservoirVolume * 1000) / flowRate : 0;
		const heatTransferRadiator = flowRate ? (radiatorVolume * 1000) / flowRate : 0;

		// Coolant flows from the reservoir to the radiator, then through systems, then back to the reservoir
		const heatToRadiator = radiatorInCoolantLoop
			? (reservoirTemperature - radiatorTemperature) /
				(heatTransferRadiator || Number.POSITIVE_INFINITY)
			: 0;

		// Radiate out the heat
		const wattsRadiated = radiatorArea * StephanBoltzmannConstant * radiatorTemperature ** 4;
		const radiatorLoad = wattsRadiated / (radiatorCoolantMass * coolantSpecificHeat);
		const radiatorInstTempChange = heatToRadiator - radiatorLoad;
		coolantRadiator?.updateComponent("heat", {
			heat: radiatorTemperature + radiatorInstTempChange * elapsedSeconds,
		});

		let previousSystemTemperature = radiatorInCoolantLoop
			? radiatorTemperature
			: reservoirTemperature;

		// Now process the heat change for each system
		for (const system of systems) {
			if (!system.components.heat) continue;
			const { heat, coolantVolume, heatLoad, inCoolantLoop } = system.components.heat;
			const heatTransferSystem = flowRate ? (coolantVolume * 1000) / flowRate : 1;
			const systemCoolantMass = coolantVolume * coolantDensity;
			const heatToSystem = inCoolantLoop
				? (previousSystemTemperature - heat) / heatTransferSystem
				: 0;

			// Convert to watt
			const loadHeatChange = (heatLoad * 1e3) / (systemCoolantMass * coolantSpecificHeat);

			const heatInstTempChange = heatToSystem + loadHeatChange;

			if (inCoolantLoop) {
				previousSystemTemperature = heat;
			}
			// Update the system's heat
			system.updateComponent("heat", {
				heat: heat + heatInstTempChange,
			});
		}

		// This is mostly just for aesthetics
		const heatToPump =
			(previousSystemTemperature - (coolantPump?.components.heat?.heat || reservoirTemperature)) /
			(heatTransferReservoir || Number.POSITIVE_INFINITY);
		coolantPump?.updateComponent("heat", {
			heat: (coolantPump.components.heat?.heat || reservoirTemperature) + heatToPump,
		});

		const heatToReservoir =
			(previousSystemTemperature - reservoirTemperature) /
			(heatTransferReservoir || Number.POSITIVE_INFINITY);
		coolantReservoir?.updateComponent("heat", {
			heat: reservoirTemperature + heatToReservoir,
		});
	}
}
