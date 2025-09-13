import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import {
	getShipSystem,
	getShipSystems,
} from "@thorium/utils/.server/ship/getShipSystem";
import {
	shipPubsubFilter,
	systemPubsubFilter,
} from "@thorium/utils/.server/shipPubsubFilter";
import type { Entity } from "@thorium/utils/ecs";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { capitalCase } from "change-case";
import { z } from "zod";

export const powerDistribution = t.router({
	systems: t.procedure
		.input(z.object({ shipId: z.number(), all: z.boolean().optional() }))
		.filter(shipPubsubFilter)

		.autoPublish(
			["power"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem?.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			const systems: {
				id: number;
				name: string;
				type: string;
				powerLevels: number[];
				currentPower: number;
				offline: boolean;
			}[] = [];
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId);
				if (
					(!system?.components.power && !input.all) ||
					!system?.components.isShipSystem
				)
					continue;
				systems.push({
					id: system.id,
					name:
						system.components.identity?.name ||
						capitalCase(system.components.isShipSystem?.type || ""),
					type: system.components.isShipSystem?.type,
					powerLevels: system.components.power?.powerLevels || [],
					currentPower: system.components.power?.currentPower || 0,
					offline: system.components.damage?.offline || false,
				});
			}
			return systems;
		}),
	systemPower: t.procedure
		.input(z.object({ systemId: z.number() }))
		.filter(systemPubsubFilter)
		.autoPublish(
			["power", "damage"],
			(entity) => entity.components.isShipSystem && { systemId: entity.id },
		)
		.request(({ ctx, input }) => {
			const system = getShipSystem(ctx.ecs, { systemId: input.systemId });

			return {
				name:
					system.components.identity?.name ||
					capitalCase(system.components.isShipSystem?.type || ""),
				powerLevels: system.components.power?.powerLevels,
				currentPower: system.components.power?.currentPower,
				offline: system.components.damage?.offline || false,
			};
		}),
	setPower: t.procedure
		.input(z.object({ systemId: z.number(), currentPower: z.number() }))
		.send(({ ctx, input }) => {
			const system = getShipSystem(ctx.ecs, { systemId: input.systemId });
			system.updateComponent("power", { currentPower: input.currentPower });

			pubsub.publish.legacy.powerDistribution.systems({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
			pubsub.publish.legacy.powerDistribution.systemPower({
				systemId: system.id,
			});
		}),
	fluxSystemPower: t.procedure
		.input(
			z.union([
				z.object({ systemId: z.number() }),
				z.object({ all: z.literal(true), shipId: z.number() }),
				z.object({ random: z.literal(true), shipId: z.number() }),
			]),
		)
		.send(({ ctx, input }) => {
			function fluxPower(sys: Entity) {
				if (sys.components.power) {
					const level =
						Math.round(1 + ctx.ecs.rng.next() + 0.5) *
						Math.sign(ctx.ecs.rng.next());
					sys.updateComponent("power", {
						currentPower: Math.max(
							0,
							Math.min(40, sys.components.power.currentPower + level),
						),
					});
					pubsub.publish.legacy.powerDistribution.systemPower({
						systemId: sys.id,
					});
				}
			}

			if ("systemId" in input) {
				const entity = ctx.ecs.getEntityById(input.systemId);
				if (entity) {
					fluxPower(entity);
					pubsub.publish.legacy.powerDistribution.systems({
						shipId: entity.components.isShipSystem?.shipId || -1,
					});
				}

				return;
			}

			const ship = ctx.ecs.getEntityById(input.shipId);
			const shipSystems: Entity[] = [];
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId);
				if (system?.components.power) {
					shipSystems.push(system);
					if ("all" in input) {
						fluxPower(system);
					}
				}
			}
			if ("random" in input) {
				fluxPower(randomFromList(shipSystems));
			}
			pubsub.publish.legacy.powerDistribution.systems({ shipId: input.shipId });
		}),
	setOffline: t.procedure
		.input(z.object({ systemId: z.number(), offline: z.boolean() }))
		.send(({ ctx, input }) => {
			const system = getShipSystem(ctx.ecs, { systemId: input.systemId });
			system.updateComponent("damage", { offline: input.offline });

			pubsub.publish.legacy.powerDistribution.systems({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
			pubsub.publish.legacy.powerDistribution.systemPower({
				systemId: system.id,
			});
			if (system.components.isReactor) {
				pubsub.publish.legacy.powerDistribution.reactors({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
				pubsub.publish.legacy.reactorControl.reactors({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
			}
		}),
	reactors: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isReactor"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const reactors = getShipSystems(ctx.ecs, {
				systemType: "reactor",
				shipId: input.shipId,
			});

			return reactors.map((reactor) => ({
				id: reactor.id,
				name: reactor.components.identity?.name || "",
				maxOutput: reactor.components.isReactor?.maxOutput || 0,
				efficiency: reactor.components.damage?.efficiency || 0,
				offline: reactor.components.damage?.offline,
			}));
		}),
	setReactorPower: t.procedure
		.input(z.object({ systemId: z.number(), maxOutput: z.number() }))
		.send(({ ctx, input }) => {
			const system = getShipSystem(ctx.ecs, { systemId: input.systemId });
			system.updateComponent("isReactor", { maxOutput: input.maxOutput });

			pubsub.publish.legacy.powerDistribution.reactors({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
			pubsub.publish.legacy.reactorControl.reactors({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
		}),
	setReactorEfficiency: t.procedure
		.input(
			z.union([
				z.object({ systemId: z.number(), efficiency: z.number().nullable() }),
				z.object({ shipId: z.number(), efficiency: z.number().nullable() }),
			]),
		)
		.send(({ ctx, input }) => {
			if ("systemId" in input) {
				const system = getShipSystem(ctx.ecs, { systemId: input.systemId });
				if (typeof input.efficiency === "number") {
					system.updateComponent("damage", { efficiency: input.efficiency });
					system.updateComponent("isReactor", { externalPower: false });
				} else {
					system.updateComponent("isReactor", { externalPower: true });
				}

				pubsub.publish.legacy.powerDistribution.reactors({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
				pubsub.publish.legacy.reactorControl.reactors({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
			} else {
				const systems = getShipSystems(ctx.ecs, {
					systemType: "reactor",
					shipId: input.shipId,
				});
				for (const system of systems) {
					if (typeof input.efficiency === "number") {
						system.updateComponent("damage", { efficiency: input.efficiency });
						system.updateComponent("isReactor", { externalPower: false });
					} else {
						system.updateComponent("isReactor", { externalPower: true });
					}
				}
				pubsub.publish.legacy.powerDistribution.reactors({
					shipId: input.shipId,
				});
				pubsub.publish.legacy.reactorControl.reactors({
					shipId: input.shipId,
				});
			}
		}),
	batteries: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isBattery"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const batteries = getShipSystems(ctx.ecs, {
				systemType: "battery",
				shipId: input.shipId,
			});

			return batteries.flatMap((battery) =>
				battery.components.isBattery && !battery.components.isPhaseCapacitor
					? {
							id: battery.id,
							capacity: battery.components.isBattery?.capacity || 1,
						}
					: [],
			);
		}),
});
