import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import { z } from "zod";

export const viewscreen = t.router({
	system: t.procedure
		.input(z.object({ clientId: z.string() }))
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const systemId = ctx.getPlayerShip(input.clientId)?.components.position
				?.parentId;
			if (typeof systemId !== "number") return null;
			const system = ctx.flight?.ecs.getEntityById(systemId);
			if (!system) return null;

			return {
				id: system.id,
				name: system.components.identity?.name,
				skyboxKey: system.components.isSolarSystem?.skyboxKey,
			};
		}),
	viewscreenConfig: t.procedure
		.input(z.object({ clientId: z.string() }))
		.autoPublish(["isViewscreen"], () => null)
		.request(({ ctx, input }) => {
			const flightClient =
				ctx.getFlightClient(input.clientId)?.components.flightClient;
			if (!flightClient?.shipId || !flightClient?.stationId) return null;

			const viewscreenEntities =
				ctx.flight?.ecs.componentCache.get("isViewscreen");
			if (!viewscreenEntities) return null;

			for (const entity of viewscreenEntities) {
				const vs = entity.components.isViewscreen;
				if (
					vs &&
					vs.shipId === flightClient.shipId &&
					vs.name === flightClient.stationId
				) {
					return {
						cameraYaw: vs.cameraYaw,
						cameraPitch: vs.cameraPitch,
						showGizmos: vs.showGizmos,
						showLayout: vs.showLayout,
						isMainViewscreen: vs.isMainViewscreen,
						name: vs.name,
						brokenMode: vs.brokenMode,
						camerasOffline: vs.camerasOffline,
						damageBroken: vs.damageBroken,
					};
				}
			}
			return null;
		}),
	allViewscreens: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const viewscreenEntities =
				ctx.flight?.ecs.componentCache.get("isViewscreen");
			if (!viewscreenEntities) return { viewscreens: [], viewscreenSystemOffline: false };

			let viewscreenSystemOffline = false;
			const results: Array<{
				entityId: number;
				name: string;
				camerasOffline: boolean;
				damageBroken: boolean;
				brokenMode: "fullyBroken" | "cameraBrokenOnly" | "invincible";
			}> = [];
			for (const entity of viewscreenEntities) {
				const vs = entity.components.isViewscreen;
				if (vs && vs.shipId === input.shipId) {
					if (!viewscreenSystemOffline && vs.viewscreenSystemId) {
						const parentEntity = ctx.flight?.ecs.getEntityById(vs.viewscreenSystemId);
						viewscreenSystemOffline = parentEntity?.components.damage?.offline ?? false;
					}
					results.push({
						entityId: entity.id,
						name: vs.name,
						camerasOffline: vs.camerasOffline,
						damageBroken: vs.damageBroken,
						brokenMode: vs.brokenMode,
					});
				}
			}
			return { viewscreens: results, viewscreenSystemOffline };
		}),
	setCamerasOffline: t.procedure
		.input(
			z.object({
				entityId: z.number(),
				camerasOffline: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const entity = ctx.flight?.ecs.getEntityById(input.entityId);
			if (!entity?.components.isViewscreen) return;
			entity.updateComponent("isViewscreen", {
				camerasOffline: input.camerasOffline,
			}, true);
			pubsub.publish.viewscreen.allViewscreens({ shipId: entity.components.isViewscreen.shipId });
		}),
	setAllCamerasOffline: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				camerasOffline: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const viewscreenEntities =
				ctx.flight?.ecs.componentCache.get("isViewscreen");
			if (!viewscreenEntities) return;
			for (const entity of viewscreenEntities) {
				const vs = entity.components.isViewscreen;
				if (vs && vs.shipId === input.shipId) {
					entity.updateComponent("isViewscreen", {
						camerasOffline: input.camerasOffline,
					}, true);
				}
			}
			pubsub.publish.viewscreen.allViewscreens({ shipId: input.shipId });
		}),
	// TODO: This is a temporary endpoint for testing viewscreen damage states.
	// It will be removed when a comprehensive damage control dashboard is built
	// that lets the FD manipulate damage on any ship system, not just viewscreens.
	simulateDamage: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				offline: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const viewscreenEntities =
				ctx.flight?.ecs.componentCache.get("isViewscreen");
			if (!viewscreenEntities) return;

			// Find the parent system entity from any viewscreen on this ship
			let parentEntity: ReturnType<NonNullable<typeof ctx.flight>["ecs"]["getEntityById"]> | undefined;
			for (const entity of viewscreenEntities) {
				const vs = entity.components.isViewscreen;
				if (vs && vs.shipId === input.shipId && vs.viewscreenSystemId) {
					parentEntity = ctx.flight?.ecs.getEntityById(vs.viewscreenSystemId);
					break;
				}
			}
			if (!parentEntity?.components.damage) return;

			parentEntity.updateComponent("damage", { offline: input.offline });

			// Force-propagate damageBroken to all child viewscreens immediately
			for (const entity of viewscreenEntities) {
				const vs = entity.components.isViewscreen;
				if (vs && vs.shipId === input.shipId) {
					const shouldBeBroken = vs.brokenMode === "invincible" ? false : input.offline;
					if (vs.damageBroken !== shouldBeBroken) {
						entity.updateComponent("isViewscreen", { damageBroken: shouldBeBroken }, true);
					}
				}
			}
			pubsub.publish.viewscreen.allViewscreens({ shipId: input.shipId });
		}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) return false;
			const systemId = ship.components.position?.parentId || null;

			return Boolean(
				(entity.components.position &&
					entity.components.position.parentId === systemId) ||
					((entity.components.isWarpEngines ||
						entity.components.isImpulseEngines) &&
						ship?.components.shipSystems?.shipSystems.has(entity.id)),
			);
		}),
});
