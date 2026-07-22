import type BaseShipSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/BaseSystem";
import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { components, type ComponentIds } from "@thorium/ecs-components";
import { shipMap } from "@thorium/ecs-components/list";
import { Entity } from "@thorium/utils/ecs";
import { mergeDeep } from "@thorium/utils/operations/mergeDeep";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { randomPointInCircle } from "@thorium/utils/operations/randomPointInSphere";
import type { z } from "zod";

export function spawnShipSystem(
	shipId: number,
	systemPlugin: Partial<BaseShipSystemPlugin>,
	flightMode: "legacy" | "nova",
	shipRooms: z.infer<typeof shipMap>["deckNodes"],
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

		const componentName = `is${template.type[0].toUpperCase()}${template.type.slice(
			1,
		)}` as `is${Capitalize<typeof template.type>}`;

		const flags = ShipSystemTypes[template.type].flags;

		if (template.type === "phasers") {
			const phaserBanks: number[] = [];

			if (
				flightMode === "legacy" &&
				"legacyPhaserBanks" in template &&
				typeof template.legacyPhaserBanks === "number"
			) {
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
			}
			entity.addComponent("isPhasers", { ...template, legacyPhaserBanks: phaserBanks });
		} else if (flightMode === "legacy" && template.type === "sensors") {
			entity.addComponent("isLegacySensors", template as any);
			entity.addComponent("isLegacySensorScanning", template as any);
		} else if (template.type !== "generic" && componentName in components)
			entity.addComponent(componentName as ComponentIds, template);

		if (
			template.type === "exocomps" &&
			"exocompCount" in template &&
			typeof template.exocompCount === "number"
		) {
			// Create the exocomp entities
			const {
				exocompName,
				exocompMaxCharge: maxCharge,
				exocompChargeRate: chargeRate,
				exocompIdleDischargeRate: idleDischargeRate,
				exocompWorkingDischargeRate: workingDischargeRate,
				exocompMovingDischargeRate: movingDischargeRate,
				exocompMovementSpeed: movementSpeed,
				exocompCargoVolume: volume,
			} = template as any;
			let room:
				| { id: number; x: number; y: number; deckIndex: number; radius?: number }
				| undefined = randomFromList(
				shipRooms.filter((r) => r.isRoom && r.systems?.includes("exocomps")),
			);
			if (!room) {
				room = randomFromList(shipRooms.filter((r) => r.isRoom));
				console.error(
					"Exocomps system is not assigned to a room, which means exocomps have no place to return to.",
				);
			} else {
				for (let i = 0; i < template.exocompCount; i++) {
					const exocompEntity = new Entity();
					exocompEntity.addComponent("identity", { name: `${exocompName} ${i + 1}` });
					exocompEntity.addComponent("exocomp", {
						shipId,
						maxCharge,
						currentCharge: maxCharge,
						chargeRate,
						idleDischargeRate,
						workingDischargeRate,
						movingDischargeRate,
					});
					exocompEntity.addComponent("cargoContainer", { volume });
					exocompEntity.addComponent("passengerMovement", {
						movementMaxVelocity: { x: movementSpeed, y: movementSpeed, z: movementSpeed / 10 },
						destinationNode: room.id,
					});
					// Place this exocomp inside the exocomp room. Otherwise, put it in a random place on the ship and log a warning.
					const [x, y] = randomPointInCircle(room?.radius || 0);
					exocompEntity.addComponent("position", {
						parentId: shipId,
						type: "ship",
						...(room ? { x: room.x + x, y: room.y + y, z: room.deckIndex } : null),
					});
					entities.push(exocompEntity);
				}
			}
		}
		const {
			powerToHeat,
			maxHeat,
			maxSafeHeat,
			nominalHeat,
			powerLevels,
			coolantConsumptionRate,
			coolantTransferRate,
		} = systemPlugin;
		if (isPlayerShip) {
			if (flags.includes("heat")) {
				entity.addComponent("heat", {
					powerToHeat: overrides.powerToHeat || powerToHeat,
					maxHeat: overrides.maxHeat || maxHeat,
					maxSafeHeat: overrides.maxSafeHeat || maxSafeHeat,
					nominalHeat: overrides.nominalHeat || nominalHeat,
					heat: overrides.nominalHeat || nominalHeat,
				});
				if (flightMode === "legacy") {
					entity.addComponent("legacyCoolant", {
						coolantConsumptionRate: overrides.coolantConsumptionRate || coolantConsumptionRate,
						coolantTransferRate: overrides.coolantTransferRate || coolantTransferRate,
					});
				}
			}
			if (flightMode === "legacy" && template.type === "coolantTank") {
				entity.addComponent("legacyCoolant", {
					coolantConsumptionRate: overrides.coolantConsumptionRate || coolantConsumptionRate,
					coolantTransferRate: overrides.coolantTransferRate || coolantTransferRate,
				});
			}

			if (flags.includes("damage")) entity.addComponent("damage");
		}
		if (flags.includes("power")) {
			entity.addComponent("power", {
				powerLevels: overrides.powerLevels || powerLevels,
			});
		}
	}

	return entities;
}
