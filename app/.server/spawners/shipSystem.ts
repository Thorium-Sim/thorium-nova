import type BaseShipSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/BaseSystem";
import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { components, type ComponentIds } from "@thorium/ecs-components";
import { Entity } from "@thorium/utils/ecs";
import { mergeDeep } from "@thorium/utils/operations/mergeDeep";

export function spawnShipSystem(
	shipId: number,
	systemPlugin: Partial<BaseShipSystemPlugin>,
	flightMode: "legacy" | "nova",
	isPlayerShip?: boolean,
	overrides: Record<string, any> = {},
) {
	const entity = new Entity();
	const entities = [entity];

	const template = mergeDeep(systemPlugin, overrides);

	entity.addComponent("identity", {
		name: template.name,
		description: template.description,
	});
	entity.addComponent("tags", { tags: template.tags });

	if (template.soundEffects) {
		entity.addComponent("soundEffects", {
			soundBank: template.soundEffects,
		});
	}

	if (template.type) {
		entity.addComponent("isShipSystem", { type: template.type, shipId });

		const componentName =
			`is${template.type[0].toUpperCase()}${template.type.slice(
				1,
			)}` as `is${Capitalize<typeof template.type>}`;

		const flags = ShipSystemTypes[template.type].flags;

		if (
			flightMode === "legacy" &&
			template.type === "phasers" &&
			"legacyPhaserBanks" in template &&
			typeof template.legacyPhaserBanks === "number"
		) {
			const phaserBanks: number[] = [];
			for (let i = 0; i < template.legacyPhaserBanks; i++) {
				// Create phaser banks for each phaser system
				const phaserBank = new Entity();
				phaserBank.addComponent("isPhaserBank", {
					// @ts-expect-error
					chargeSpeed: template.legacyChargeSpeed,
					phaserId: entity.id,
					shipId,
				});
				phaserBank.addComponent("heat");
				entities.push(phaserBank);
				phaserBanks.push(phaserBank.id);
			}
			template.legacyPhaserBanks = phaserBanks;
		}
		if (template.type !== "generic" && componentName in components)
			entity.addComponent(componentName as ComponentIds, template);

		const {
			powerToHeat,
			heatDissipationRate,
			maxHeat,
			maxSafeHeat,
			nominalHeat,
			powerLevels,
			defaultPower,
			coolantConsumptionRate,
			coolantTransferRate,
		} = systemPlugin;
		if (isPlayerShip) {
			if (flags.includes("heat")) {
				entity.addComponent("heat", {
					powerToHeat: overrides.powerToHeat || powerToHeat,
					heatDissipationRate:
						overrides.heatDissipationRate || heatDissipationRate,
					maxHeat: overrides.maxHeat || maxHeat,
					maxSafeHeat: overrides.maxSafeHeat || maxSafeHeat,
					nominalHeat: overrides.nominalHeat || nominalHeat,
					heat: overrides.nominalHeat || nominalHeat,
				});
				if (flightMode === "legacy") {
					entity.addComponent("legacyCoolant", {
						coolantConsumptionRate:
							overrides.coolantConsumptionRate || coolantConsumptionRate,
						coolantTransferRate:
							overrides.coolantTransferRate || coolantTransferRate,
					});
				}
			}
			if (flightMode === "legacy" && template.type === "coolantTank") {
				entity.addComponent("legacyCoolant", {
					coolantConsumptionRate:
						overrides.coolantConsumptionRate || coolantConsumptionRate,
					coolantTransferRate:
						overrides.coolantTransferRate || coolantTransferRate,
				});
			}

			if (flags.includes("damage")) entity.addComponent("damage");
		}
		if (flags.includes("power")) {
			entity.addComponent("power", {
				powerLevels: overrides.powerLevels || powerLevels,
				defaultPower: overrides.defaultPower || defaultPower,
			});
		}
	}

	return entities;
}
