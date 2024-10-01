import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { z } from "zod";
import { getShipSystem, getShipSystems } from "@server/utils/getShipSystem";
import { calculateCargoUsed, getRoomBySystem } from "../CargoControl/data";
import { getInventoryTemplates } from "@server/utils/getInventoryTemplates";
import { randomFromList } from "@server/utils/randomFromList";
import { spawnTorpedo } from "@server/spawners/torpedo";
import type { Entity } from "@server/utils/ecs";
import {
	getCurrentTarget,
	getTargetIsInPhaserRange,
} from "@server/systems/PhasersSystem";

export const targeting = t.router({
	targetedContact: t.procedure
		.filter((publish: { shipId: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			const system = getShipSystem(ctx, {
				systemType: "targeting",
			});
			const target = system.components.isTargeting?.target;
			if (typeof target !== "number") return null;
			const targetEntity = ctx.flight?.ecs.getEntityById(target);
			return targetEntity
				? {
						id: target,
						name: targetEntity.components.identity?.name,
						description: targetEntity.components.identity?.description,
				  }
				: null;
		}),
	setTarget: t.procedure
		.input(z.object({ target: z.union([z.number(), z.null()]) }))
		.send(({ input, ctx }) => {
			if (!ctx.ship) throw new Error("No ship found.");
			const targeting = getShipSystem(ctx, {
				systemType: "targeting",
			});
			if (!targeting.components.isTargeting)
				throw new Error("System is not targeting");

			targeting.updateComponent("isTargeting", { target: input.target });
			pubsub.publish.targeting.targetedContact({
				shipId: ctx.ship.id,
			});
		}),
	torpedoes: t.router({
		list: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				if (!ctx.ship) throw new Error("No ship found.");
				const templates = getInventoryTemplates(ctx.flight?.ecs);
				const torpedoRooms = getRoomBySystem(ctx.ship, "torpedoLauncher");
				const torpedoList: Record<
					string,
					{ count: number; yield: number; speed: number }
				> = {};
				for (const room of torpedoRooms) {
					for (const item in room.contents) {
						const template = templates[item];
						if (
							!template ||
							!template.flags.torpedoCasing ||
							!template.flags.torpedoWarhead
						)
							continue;
						if (!torpedoList[item]) {
							torpedoList[item] = {
								count: 0,
								yield: template.flags.torpedoWarhead.yield,
								speed: template.flags.torpedoCasing.speed,
							};
						}
						torpedoList[item].count += room.contents[item].count;
					}
				}
				return torpedoList;
			}),
		launchers: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const systems = getShipSystems(ctx, {
					systemType: "TorpedoLauncher",
				}).filter(
					(system) => system.components.isShipSystem?.shipId === ctx.ship?.id,
				);

				return systems.flatMap((system) => {
					if (!system.components.isTorpedoLauncher) return [];
					const torpedoEntity =
						system.components.isTorpedoLauncher?.torpedoEntity;
					const torpedo = torpedoEntity
						? ctx.flight?.ecs.getEntityById(torpedoEntity)
						: null;
					return {
						id: system.id,
						name: system.components.identity?.name || "Torpedo Launcher",
						state: system.components.isTorpedoLauncher.status,
						fireTime: system.components.isTorpedoLauncher.fireTime,
						loadTime: system.components.isTorpedoLauncher.loadTime,
						torpedo: torpedo
							? {
									id: torpedo.id,
									casingColor:
										torpedo.components.isInventory?.flags.torpedoCasing?.color,
									warheadColor:
										torpedo.components.isInventory?.flags.torpedoWarhead?.color,
									warheadDamageType:
										torpedo.components.isInventory?.flags.torpedoWarhead
											?.damageType,
									guidanceColor:
										torpedo.components.isInventory?.flags.torpedoGuidance
											?.color,
									guidanceMode:
										torpedo.components.isInventory?.flags.torpedoGuidance
											?.guidanceMode,
							  }
							: null,
					};
				});
			}),
		load: t.procedure
			.input(
				z.object({
					launcherId: z.number(),
					torpedoId: z.string().nullable(),
				}),
			)
			.send(({ input, ctx }) => {
				if (!ctx.ship) throw new Error("No ship found.");
				const launcher = getShipSystem(ctx, {
					systemId: input.launcherId,
				});
				if (!launcher.components.isTorpedoLauncher)
					throw new Error("System is not a torpedo launcher");
				if (
					input.torpedoId &&
					launcher.components.isTorpedoLauncher.status !== "ready"
				) {
					throw new Error("Torpedo launcher is not ready");
				}
				if (
					!input.torpedoId &&
					launcher.components.isTorpedoLauncher.status !== "loaded"
				) {
					throw new Error("Torpedo launcher is not loaded");
				}
				launcher.components.isTorpedoLauncher.torpedoEntity;
				const torpedoEntity = adjustTorpedoInventory(
					ctx.ship,
					input.torpedoId,
					launcher,
				);

				launcher.updateComponent("isTorpedoLauncher", {
					status: torpedoEntity ? "loading" : "unloading",
					progress: launcher.components.isTorpedoLauncher.loadTime,
					...(torpedoEntity ? { torpedoEntity } : {}),
				});
				pubsub.publish.targeting.torpedoes.launchers({
					shipId: ctx.ship!.id,
				});
			}),
		fire: t.procedure
			.input(
				z.object({
					launcherId: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const launcher = getShipSystem(ctx, {
					systemId: input.launcherId,
				});
				if (!launcher.components.isTorpedoLauncher)
					throw new Error("System is not a torpedo launcher");
				if (launcher.components.isTorpedoLauncher.status !== "loaded") {
					throw new Error("Torpedo launcher is not loaded");
				}

				const inventoryTemplate = ctx.flight?.ecs.getEntityById(
					launcher.components.isTorpedoLauncher.torpedoEntity!,
				);
				if (!inventoryTemplate) throw new Error("Torpedo not found");

				const torpedo = spawnTorpedo(launcher);
				launcher.ecs?.addEntity(torpedo);

				launcher.updateComponent("isTorpedoLauncher", {
					status: "firing",
					progress: launcher.components.isTorpedoLauncher.fireTime,
				});
				pubsub.publish.targeting.torpedoes.launchers({
					shipId: ctx.ship!.id,
				});
				pubsub.publish.starmapCore.torpedos({
					systemId: torpedo.components.position?.parentId || null,
				});
			}),
	}),
	hull: t.procedure
		.filter((publish: { shipId: number }, { ctx }) => {
			if (publish && publish.shipId !== ctx.ship?.id) return false;
			return true;
		})
		.request(({ ctx }) => {
			return ctx.ship?.components.hull?.hull || 0;
		}),
	shields: t.router({
		get: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const systems = getShipSystems(ctx, {
					systemType: "Shields",
				}).filter(
					(system) => system.components.isShipSystem?.shipId === ctx.ship?.id,
				);

				return systems.flatMap((system) => {
					if (!system.components.isShields) return [];
					return {
						id: system.id,
						state: system.components.isShields.state,
						strength: system.components.isShields.strength,
						maxStrength: system.components.isShields.maxStrength,
						direction: system.components.isShields.direction,
						frequency: system.components.isShields.frequency,
					};
				});
			}),
		setState: t.procedure
			.input(
				z.object({
					shieldId: z.number().optional(),
					state: z.union([z.literal("up"), z.literal("down")]),
				}),
			)
			.send(({ input, ctx }) => {
				const shieldId = input.shieldId;
				if (shieldId) {
					const shield = getShipSystem(ctx, {
						systemId: shieldId,
					});
					if (!shield.components.isShields)
						throw new Error("System is not a shield generator");
					shield.updateComponent("isShields", {
						state: input.state,
					});
				} else {
					const shields = getShipSystems(ctx, {
						systemType: "Shields",
					}).filter(
						(system) => system.components.isShipSystem?.shipId === ctx.ship?.id,
					);
					for (const shield of shields) {
						shield.updateComponent("isShields", {
							state: input.state,
						});
					}
				}
				pubsub.publish.targeting.shields.get({
					shipId: ctx.ship!.id,
				});
			}),
	}),
	phasers: t.router({
		list: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const systems = getShipSystems(ctx, {
					systemType: "Phasers",
				}).filter(
					(system) => system.components.isShipSystem?.shipId === ctx.ship?.id,
				);

				return systems.flatMap((system) => {
					if (!system.components.isPhasers) return [];

					return {
						id: system.id,
						name: system.components.identity?.name || "Phasers",
						firePercent: system.components.isPhasers.firePercent,
						arc: system.components.isPhasers.arc,
						heading: system.components.isPhasers.headingDegree,
						pitch: system.components.isPhasers.pitchDegree,
						maxOutput: system.components.power?.powerSources.length || 0,
						maxRange: system.components.isPhasers.maxRange,
						maxArc: system.components.isPhasers.maxArc,
						nominalHeat: system.components.heat?.nominalHeat || 0,
						maxSafeHeat: system.components.heat?.maxSafeHeat || 1,
					};
				});
			}),
		/**
		 * All of the phasers in a system or the same system as the requesting ship
		 * which are currently being fired.
		 */
		firing: t.procedure
			.input(
				z
					.object({
						systemId: z.number().optional(),
					})
					.optional(),
			)
			.filter(
				(
					publish: { shipId: number; systemId: number | null },
					{ ctx, input },
				) => {
					if (
						(publish && publish.shipId !== ctx.ship?.id) ||
						(input?.systemId && input.systemId !== publish.systemId)
					)
						return false;
					return true;
				},
			)
			.request(({ input, ctx }) => {
				const systemId =
					input?.systemId || ctx.ship?.components.position?.parentId || null;
				// Get all of the ships in the system
				const ships: Entity[] = [];
				for (const ship of ctx.flight?.ecs.componentCache.get("isShip") || []) {
					if (ship.components.position?.parentId === systemId) {
						ships.push(ship);
					}
				}
				const shipIds = ships.map((ship) => ship.id);

				// Get all of the ship phasers that are currently firing
				const firingPhasers: Entity[] = [];
				const phaserEntities = ctx.flight?.ecs.componentCache.get("isPhasers");
				for (const phaser of phaserEntities || []) {
					if (
						shipIds.includes(phaser.components.isShipSystem?.shipId || -1) &&
						phaser.components.isPhasers &&
						phaser.components.isPhasers.firePercent > 0
					) {
						firingPhasers.push(phaser);
					}
				}

				return firingPhasers.flatMap((phaser) => {
					const target = getCurrentTarget(
						phaser.components.isShipSystem?.shipId || -1,
						phaser.ecs!,
					);
					if (!target) return [];
					return {
						id: phaser.id,
						shipId: phaser.components.isShipSystem?.shipId || -1,
						targetId: target.id,
						firePercent: phaser.components.isPhasers?.firePercent || 0,
					};
				});
			}),
		setArc: t.procedure
			.input(
				z.object({
					phaserId: z.number(),
					arc: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const phaser = getShipSystem(ctx, {
					systemId: input.phaserId,
				});
				if (!phaser.components.isPhasers)
					throw new Error("System is not a phaser");
				phaser.updateComponent("isPhasers", {
					arc: input.arc,
				});
				pubsub.publish.targeting.phasers.list({
					shipId: phaser.components.isShipSystem?.shipId || -1,
				});
			}),
		fire: t.procedure
			.input(
				z.object({
					phaserId: z.number(),
					firePercent: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const phaser = getShipSystem(ctx, {
					systemId: input.phaserId,
				});
				if (!phaser.components.isPhasers)
					throw new Error("System is not a phaser");

				// TODO: Check if the phaser has sufficient power
				// to be able to fire at the requested power level
				phaser.updateComponent("isPhasers", {
					firePercent: input.firePercent,
				});

				const ship = ctx.flight?.ecs.getEntityById(
					phaser.components.isShipSystem?.shipId || -1,
				);
				pubsub.publish.targeting.phasers.firing({
					shipId: ship!.id,
					systemId: ship?.components.position?.parentId || null,
				});
				pubsub.publish.targeting.phasers.list({
					shipId: phaser.components.isShipSystem?.shipId || -1,
				});
			}),
	}),
	stream: t.procedure.dataStream(({ entity, ctx }) => {
		if (!entity) return false;
		return Boolean(entity.components.isShields || entity.components.isPhasers);
	}),
});

function adjustTorpedoInventory(
	ship: Entity,
	torpedoId: string | null,
	launcher: Entity,
) {
	let adjustment = -1;
	const ecs = ship.ecs!;

	if (!torpedoId) {
		adjustment = 1;
		const torpedo = ecs.getEntityById(
			launcher.components.isTorpedoLauncher?.torpedoEntity!,
		);
		if (!torpedo) throw new Error("Torpedo not found");
		torpedoId = torpedo.components.identity?.name || "";
	}

	const inventoryTemplates = getInventoryTemplates(ecs);
	const inventoryTemplate = inventoryTemplates[torpedoId];
	if (!inventoryTemplate) throw new Error("Torpedo not found");

	const torpedo = ecs.getEntityById(inventoryTemplate.entityId);
	if (!torpedo) throw new Error("Torpedo not found");
	const torpedoEntity = adjustment >= 1 ? null : torpedo.id;
	const torpedoRoom = randomFromList(
		getRoomBySystem(ship, "torpedoLauncher").filter((room) => {
			if (adjustment < 1) {
				return room.contents[torpedoId!]?.count > 0;
			}
			const cargoUsed = calculateCargoUsed(room.contents, inventoryTemplates);
			const volume = room.volume || 0;
			const torpedoVolume = inventoryTemplates[torpedoId].volume;
			return cargoUsed + torpedoVolume <= volume;
		}),
	);

	if (!torpedoRoom) throw new Error("No torpedo room found");
	if (adjustment < 1 && torpedoRoom.contents[torpedoId].count <= 0) {
		throw new Error("No torpedoes available");
	}
	torpedoRoom.contents[torpedoId].count += adjustment;

	pubsub.publish.cargoControl.rooms({
		shipId: ship.id,
	});
	pubsub.publish.targeting.torpedoes.list({
		shipId: ship.id,
	});

	return torpedoEntity;
}
