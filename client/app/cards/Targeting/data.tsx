import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { z } from "zod";
import { getShipSystem, getShipSystems } from "@server/utils/getShipSystem";
import { calculateCargoUsed, getRoomBySystem } from "../CargoControl/data";
import { getInventoryTemplates } from "@server/utils/getInventoryTemplates";
import { randomFromList } from "@server/utils/randomFromList";
import { spawnTorpedo } from "@server/spawners/torpedo";
import type { Entity } from "@server/utils/ecs";

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
	torpedoList: t.procedure
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
	torpedoLaunchers: t.procedure
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
									torpedo.components.isInventory?.flags.torpedoGuidance?.color,
								guidanceMode:
									torpedo.components.isInventory?.flags.torpedoGuidance
										?.guidanceMode,
						  }
						: null,
				};
			});
		}),
	loadTorpedo: t.procedure
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
			pubsub.publish.targeting.torpedoLaunchers({
				shipId: ctx.ship!.id,
			});
		}),
	fireTorpedo: t.procedure
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
			pubsub.publish.targeting.torpedoLaunchers({
				shipId: ctx.ship!.id,
			});
			pubsub.publish.starmapCore.torpedos({
				systemId: torpedo.components.position?.parentId || null,
			});
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
	pubsub.publish.targeting.torpedoList({
		shipId: ship.id,
	});

	return torpedoEntity;
}
