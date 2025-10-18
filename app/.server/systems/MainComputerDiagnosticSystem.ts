import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";
import type { KiloWattHour } from "@thorium/utils/unitTypes";

export class MainComputerDiagnosticSystem extends System {
	static flightMode = ["nova"];
	/** The number of concurrent diagnostics */
	diagnosticCount = new Map<number, number>();
	test(entity: Entity) {
		return !!entity.components.diagnostic;
	}
	preUpdate(_elapsed: number): void {
		this.diagnosticCount.clear();
		// Each concurrent diagnostic decreases the total amount each diagnostic progresses
		for (const diagnostic of this.ecs.componentCache.get("diagnostic") || []) {
			const parentId = diagnostic.components.diagnostic?.shipId;
			if (!diagnostic.components.diagnostic || !parentId) continue;
			if (diagnostic.components.diagnostic.progress >= 1) continue;
			if (!this.diagnosticCount.has(parentId))
				this.diagnosticCount.set(parentId, 0);
			this.diagnosticCount.set(
				parentId,
				(this.diagnosticCount.get(parentId) || 0) + 1,
			);
		}
	}
	update(entity: Entity, elapsedMs: number): void {
		const elapsedTimeHours = elapsedMs / 1000 / 60 / 60;
		const diagnostic = entity.components.diagnostic;
		if (!diagnostic) return;

		if (diagnostic.progress >= 1) return;

		const allMainComputers = this.ecs.componentCache.get("isMainComputer");
		let mainComputer: Entity | null = null;
		for (const mainComputerEntity of allMainComputers || []) {
			if (
				mainComputerEntity.components.isShipSystem?.shipId === diagnostic.shipId
			) {
				mainComputer = mainComputerEntity;
				break;
			}
		}
		const mainComputerSystem = mainComputer?.components.isMainComputer;
		const shipId = mainComputer?.components.isShipSystem?.shipId;

		const parent = this.ecs.getEntityById(diagnostic.shipId);

		if (!mainComputer || !mainComputerSystem || !shipId) return;
		const diagnosticCount = this.diagnosticCount.get(shipId);
		if (!diagnosticCount) return;

		// Increase the diagnostic progress
		const { maxDiagnosticEnergyCost, minDiagnosticEnergyCost } =
			mainComputerSystem;

		let totalRequiredEnergy: KiloWattHour = Number.POSITIVE_INFINITY;
		const level = Number(diagnostic.level);
		totalRequiredEnergy =
			// Divide by three, since the minimum is what a level 1 diagnostic costs anyway
			((maxDiagnosticEnergyCost - minDiagnosticEnergyCost) / 3) **
				(level - 0.5) +
			minDiagnosticEnergyCost;

		// Fudge it for non-player ships
		const currentPower =
			(parent?.components.isPlayerShip
				? mainComputer.components.power?.currentPower
				: mainComputer.components.power?.defaultPower) || 0;
		const powerProvided = currentPower / diagnosticCount;
		// The energy provided in kilowatt hours, by converting from megawatts
		const energyProvided: KiloWattHour =
			powerProvided * elapsedTimeHours * 1000;

		const progress = Math.min(
			1,
			diagnostic.progress +
				energyProvided / (totalRequiredEnergy || Number.EPSILON),
		);
		entity.updateComponent("diagnostic", { progress });

		if (diagnostic.progress >= 1) {
			const system = this.ecs.getEntityById(diagnostic.targetSystemId);
			const damage = system?.components.damage;

			if (damage) {
				// The diagnostic is complete! Let's put some data in the database
				diagnostic.results = {
					efficiency: damage.efficiency,
					heatMultiplier: damage.heatMultiplier,
					instability: damage.instability,
					signature: damage.signature,
					failureRisk: damage.failureRisk,
					cascadeRisk: damage.cascadeRisk,
					crewSafetyRating: damage.crewSafetyRating,
				};
				// Reports are generated after selecting the damage metric to improve
				pubsub.publish.damageReports.systemDiagnostic({
					systemId: entity.components.diagnostic?.targetSystemId || -1,
				});
			}
		}
	}
}
