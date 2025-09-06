import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { z } from "zod";
import {
	getShipSystem,
	getShipSystems,
} from "@thorium/utils/.server/ship/getShipSystem";
import {
	calculateCargoUsed,
	getRoomBySystem,
} from "../CargoControl/data.server";
import { getInventoryTemplates } from "@thorium/utils/.server/getInventoryTemplates";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { spawnTorpedo } from "@thorium/.server/spawners/torpedo";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { getCurrentTarget } from "@thorium/.server/systems/PhasersSystem";
import {
	cancelLoopingSound,
	playShipSound,
} from "@thorium/utils/.server/playRangedSound";

export const targeting = t.router({
	targetedContact: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isTargeting"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const system = getShipSystem(ctx.ecs, {
				systemType: "targeting",
				shipId: input.shipId,
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
		.input(
			z.object({ shipId: z.number(), target: z.union([z.number(), z.null()]) }),
		)
		.send(({ input, ctx }) => {
			const { shipId } = input;
			const targeting = getShipSystem(ctx.ecs, {
				systemType: "targeting",
				shipId,
			});
			if (!targeting.components.isTargeting)
				throw new Error("System is not targeting");

			targeting.updateComponent("isTargeting", { target: input.target });
			pubsub.publish.targeting.targetedContact({
				shipId,
			});
		}),
	torpedoes: t.router({
		list: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish([], () => null)
			.request(({ ctx, input }) => {
				return getShipTorpedos(ctx.ecs, input.shipId);
			}),
		launchers: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isTorpedoLauncher"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)
			.request(({ ctx, input: { shipId } }) => {
				if (!ctx.flight) return [];
				const systems = getShipSystems(ctx.ecs, {
					systemType: "TorpedoLauncher",
					shipId,
				}).filter(
					(system) => system.components.isShipSystem?.shipId === shipId,
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
				const launcher = ctx.ecs.getEntityById(input.launcherId);
				if (!launcher?.components.isTorpedoLauncher)
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
				const torpedoEntity = adjustTorpedoInventory(input.torpedoId, launcher);

				launcher.updateComponent("isTorpedoLauncher", {
					status: torpedoEntity ? "loading" : "unloading",
					progress: launcher.components.isTorpedoLauncher.loadTime,
					torpedoEntity,
				});

				const ship = ctx.ecs.getEntityById(
					launcher.components.isShipSystem?.shipId || -1,
				);
				if (ship) {
					pubsub.publish.targeting.torpedoes.launchers({
						shipId: ship.id,
					});
					if (torpedoEntity) {
						cancelLoopingSound(launcher, "unload");
						playShipSound(launcher, ship, "load");
					} else {
						cancelLoopingSound(launcher, "load");
						playShipSound(launcher, ship, "unload");
					}
				}
			}),
		fire: t.procedure
			.input(
				z.object({
					launcherId: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const launcher = ctx.ecs.getEntityById(input.launcherId);

				if (!launcher?.components.isTorpedoLauncher)
					throw new Error("System is not a torpedo launcher");
				if (launcher.components.isTorpedoLauncher.status !== "loaded") {
					throw new Error("Torpedo launcher is not loaded");
				}
				const power = launcher.components.power;
				const powerLevels = power?.powerLevels || [0];
				const currentPower = power?.currentPower || 1;
				const maxSafePower = powerLevels[powerLevels.length - 1] || 1;
				const requiredPower = powerLevels[0];
				// It takes longer to reload based on the efficiency of the torpedo launcher
				// It will take min 1x and max 20x longer to fire a torpedo, depending on power
				if (requiredPower > currentPower) {
					throw new Error("Insufficient Power");
				}
				const inventoryTemplate = ctx.flight?.ecs.getEntityById(
					launcher.components.isTorpedoLauncher.torpedoEntity!,
				);
				if (!inventoryTemplate) throw new Error("Torpedo not found");

				const torpedo = spawnTorpedo(launcher);
				launcher.ecs?.addEntity(torpedo);

				const powerMultiplier =
					1 /
					Math.min(
						1,
						Math.max(
							0.05,
							(currentPower - requiredPower) / (maxSafePower - requiredPower),
						),
					);

				launcher.updateComponent("isTorpedoLauncher", {
					status: "firing",
					progress:
						launcher.components.isTorpedoLauncher.fireTime * powerMultiplier,
				});
				const ship = ctx.ecs.getEntityById(
					launcher.components.isShipSystem?.shipId || -1,
				);
				pubsub.publish.starmapCore.torpedos({
					systemId: torpedo.components.position?.parentId || null,
				});
				if (ship) {
					pubsub.publish.targeting.torpedoes.launchers({
						shipId: ship.id,
					});

					playShipSound(launcher, ship, "fire");
				}
			}),
	}),
	hull: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["hull"], (entity) => ({ shipId: entity.id }))

		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			return ship?.components.hull?.hull || 0;
		}),
	shields: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { ctx, input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isShields"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)

			.request(({ ctx, input: { shipId } }) => {
				if (!ctx.flight) return [];
				const systems = getShipSystems(ctx.ecs, {
					systemType: "Shields",
					shipId,
				}).filter(
					(system) => system.components.isShipSystem?.shipId === shipId,
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
				z.union([
					z.object({
						shieldId: z.number(),
						state: z.union([z.literal("up"), z.literal("down")]),
					}),
					z.object({
						shipId: z.number(),
						state: z.union([z.literal("up"), z.literal("down")]),
					}),
				]),
			)
			.send(({ input, ctx }) => {
				if ("shieldId" in input) {
					const shield = getShipSystem(ctx.ecs, {
						systemId: input.shieldId,
					});
					if (!shield.components.isShields)
						throw new Error("System is not a shield generator");
					shield.updateComponent("isShields", {
						state: input.state,
					});
					pubsub.publish.targeting.shields.get({
						shipId: shield.components.isShipSystem?.shipId || -1,
					});
				} else {
					const shipId = input.shipId;
					if (!ctx.flight) return;
					const shields = getShipSystems(ctx.flight.ecs, {
						systemType: "Shields",
						shipId,
					}).filter(
						(system) => system.components.isShipSystem?.shipId === shipId,
					);
					for (const shield of shields) {
						shield.updateComponent("isShields", {
							state: input.state,
						});
					}
					pubsub.publish.targeting.shields.get({
						shipId,
					});
				}
			}),
	}),
	phasers: t.router({
		list: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { ctx, input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isPhasers"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)

			.request(({ ctx, input }) => {
				if (!ctx.flight) return [];
				const systems = getShipSystems(ctx.flight.ecs, {
					systemType: "Phasers",
					shipId: input.shipId,
				}).filter(
					(system) => system.components.isShipSystem?.shipId === input.shipId,
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
				z.object({
					systemId: z.number().nullable(),
				}),
			)
			.filter((publish: { systemId: number | null }, { ctx, input }) => {
				if (!publish) return true;
				if ("systemId" in input && publish.systemId !== input.systemId)
					return false;
				return true;
			})
			.autoPublish(["isPhasers"], (entity) => {
				const systemId = entity.ecs.getEntityById(
					entity.components.isShipSystem?.shipId || -1,
				)?.components.position?.parentId;
				if (systemId) return { systemId };
				return null;
			})

			.request(({ input, ctx }) => {
				const systemId = input.systemId;

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
					const ship = phaser.ecs?.getEntityById(
						phaser.components.isShipSystem?.shipId || -1,
					);
					if (!ship) return [];
					const target = getCurrentTarget(ship);
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
				const phaser = getShipSystem(ctx.ecs, {
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
				const phaser = getShipSystem(ctx.ecs, {
					systemId: input.phaserId,
				});
				if (!phaser.components.isPhasers)
					throw new Error("System is not a phaser");

				// TODO: Check if the phaser has sufficient power
				// to be able to fire at the requested power level
				phaser.updateComponent("isPhasers", {
					firePercent: input.firePercent,
				});
				const currentPower =
					phaser.components.power?.powerSources.reduce((acc, id) => {
						const powerSource = ctx.flight?.ecs.getEntityById(id);
						if (powerSource?.components.isPhaseCapacitor) {
							return acc + (powerSource.components.isBattery?.storage || 0);
						}
						return acc;
					}, 0) || 0;

				const ship = ctx.flight?.ecs.getEntityById(
					phaser.components.isShipSystem?.shipId || -1,
				);

				pubsub.publish.targeting.phasers.list({
					shipId: phaser.components.isShipSystem?.shipId || -1,
				});

				if (input.firePercent === 0 || currentPower < 0.01) {
					cancelLoopingSound(phaser, "fire");
				} else {
					if (phaser.components.soundEffects?.soundBank.fire) {
						playShipSound(phaser, ship!, "fire");
					}
				}
				pubsub.publish.targeting.phasers.firing({
					systemId: ship?.components.position?.parentId || null,
				});
			}),
	}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ entity, input }) => {
			if (!entity) return false;
			return Boolean(
				(entity.components.isShields || entity.components.isPhasers) &&
					entity.components.isShipSystem?.shipId === input.shipId,
			);
		}),
});

export function adjustTorpedoInventory(
	torpedoId: string | null,
	launcher: Entity,
) {
	let adjustment = -1;
	const ecs = launcher.ecs!;
	const ship = ecs.getEntityById(
		launcher.components.isShipSystem?.shipId || -1,
	);
	if (!ship) throw new Error("Torpedo launcher ship not found");
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

export function getShipTorpedos(ecs: ECS, shipId: number) {
	const ship = ecs.getEntityById(shipId);
	const templates = getInventoryTemplates(ecs);
	const torpedoList: Record<
		string,
		{ count: number; yield: number; speed: number }
	> = {};
	function handleContents(
		contents: Record<
			string,
			{
				count: number;
				temperature: number;
			}
		>,
	) {
		for (const item in contents) {
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
			torpedoList[item].count += contents[item].count;
		}
	}
	if (ship?.components.shipMap) {
		const torpedoRooms = getRoomBySystem(ship, "torpedoLauncher");
		for (const room of torpedoRooms) {
			handleContents(room.contents);
		}
	} else if (ship?.components.cargoContainer) {
		handleContents(ship.components.cargoContainer.contents);
	}

	return torpedoList;
}
