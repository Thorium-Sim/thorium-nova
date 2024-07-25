import { pubsub } from "@server/init/pubsub";
import { getFlights } from "@server/utils/getFlights";
import { t } from "@server/init/t";
import { z } from "zod";
import inputAuth from "@server/utils/inputAuth";
import fs from "node:fs/promises";
import { thoriumPath } from "@server/utils/appPaths";
import { generateIncrementedName } from "@server/utils/generateIncrementedName";
import randomWords from "@thorium/random-words";
import { FlightDataModel } from "@server/classes/FlightDataModel";
import { type ECS, Entity } from "@server/utils/ecs";
import { spawnSolarSystem } from "@server/spawners/solarSystem";
import type ShipPlugin from "@server/classes/Plugins/Ship";
import type { position as positionComponent } from "@server/components/position";
import { Vector3 } from "three";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";
import { spawnShip } from "@server/spawners/ship";
import type BasePlugin from "@server/classes/Plugins";
import type StationComplementPlugin from "@server/classes/Plugins/StationComplement";
import { triggerSend } from "@server/utils/evaluateEntityQuery";

function getPlanetSystem(ecs: ECS, planet: Entity): Entity {
	const parentId = planet.components?.satellite?.parentId;
	if (parentId === undefined || parentId === null)
		throw new Error("No satellite parentId");
	const parentEntity = ecs.getEntityById(parentId);
	if (!parentEntity)
		throw new Error(
			`Could not find parent entity for planet: ${JSON.stringify(planet)} `,
		);
	if (parentEntity.components.isSolarSystem) return parentEntity;
	return getPlanetSystem(ecs, parentEntity);
}

const flightStartShips = z
	.array(
		z.object({
			crewCount: z.number(),
			shipName: z.string(),
			theme: z.object({ pluginId: z.string(), themeId: z.string() }).optional(),
			shipTemplate: z.object({
				pluginId: z.string(),
				shipId: z.string(),
			}),
			stationComplement: z
				.object({ pluginId: z.string(), stationId: z.string() })
				.optional(),
		}),
	)
	.nonempty();

function getStationComplement(
	activePlugins: BasePlugin[],
	ship: Zod.infer<typeof flightStartShips>[0],
) {
	let stationComplement = activePlugins.reduce(
		(acc: StationComplementPlugin | null, plugin) => {
			if (acc) return acc;
			if (
				ship.stationComplement &&
				plugin.id !== ship.stationComplement.pluginId
			)
				return acc;
			if (ship.stationComplement) {
				return (
					plugin.aspects.stationComplements.find(
						(pluginStationComplement) =>
							pluginStationComplement.name ===
							ship.stationComplement?.stationId,
					) || null
				);
			}
			return null;
		},
		null,
	);
	// No station complement? Find the one that best fits from the default plugin
	if (!stationComplement) {
		stationComplement = activePlugins.reduce(
			(acc: StationComplementPlugin | null, plugin) => {
				if (acc) return acc;
				if (!plugin.default) return acc;
				// TODO November 18, 2021 - Check to see if the ship is a big ship or a little ship
				// and assign the appropriate station complement based on that.
				return (
					plugin.aspects.stationComplements.find(
						(pluginStationComplement) =>
							pluginStationComplement.stationCount === ship.crewCount,
					) || null
				);
			},
			null,
		);
	}
	return stationComplement;
}

export const flight = t.router({
	active: t.procedure.request(({ ctx }) => {
		const flight = ctx.flight;
		if (!flight) return null;
		const { date, name, paused } = flight;
		return { date, name, paused };
	}),
	all: t.procedure.request(() => {
		return getFlights();
	}),
	start: t.procedure
		.input(
			z.object({
				flightName: z.string(),
				ships: flightStartShips,
				missionId: z
					.object({ pluginId: z.string(), missionId: z.string() })
					.optional(),
				startingPoint: z
					.object({
						pluginId: z.string(),
						solarSystemId: z.string(),
						objectId: z.string(),
						type: z.union([z.literal("ship"), z.literal("planet")]),
					})
					.optional(),
			}),
		)
		.send(
			async ({
				ctx,
				input: { flightName, ships, missionId, startingPoint },
			}) => {
				inputAuth(ctx);
				if (ctx.flight) return ctx.flight;
				const flightData = await getFlights();
				flightName = generateIncrementedName(
					flightName || randomWords(3).join("-"),
					flightData.map((f) => f.name),
				);
				ctx.flight = new FlightDataModel(
					{
						name: flightName,
						initialLoad: true,
						entities: [],
						serverDataModel: ctx.server,
					},
					{ path: `/flights/${flightName}.flight` },
				);

				const activePlugins = ctx.server.plugins.filter((p) => p.active);
				ctx.flight.pluginIds = activePlugins.map((p) => p.id);
				await ctx.flight.initEcs(ctx.server);
				await ctx.flight.initPhysics();
				// This will spawn all of the systems and planets bundled with the plugins
				const solarSystemMap = ctx.flight.pluginIds.reduce(
					(map: Record<string, Entity>, pluginId) => {
						const plugin = ctx.server.plugins.find(
							(plugin) => plugin.id === pluginId,
						);
						if (!plugin) return map;
						// Create entities for the universe objects
						plugin.aspects.solarSystems.forEach((solarSystem) => {
							const entities = spawnSolarSystem(solarSystem);
							entities.forEach((object) => {
								const { entity } = object;
								ctx.flight?.ecs.addEntity(entity);
								let key = `${object.pluginId}-${object.pluginSystemId}`;
								if (object.type === "planet" || object.type === "star") {
									key += `-${object.objectId}`;
								}
								map[key] = entity;
							});
						});
						return map;
					},
					{},
				);

				// Duplicate the inventory templates in the active plugins
				activePlugins.forEach((plugin) => {
					plugin.aspects.inventory.forEach((template) => {
						if (!ctx.flight) return;
						const inventory = new Entity();
						inventory.addComponent("isInventory", {
							plural: template.plural,
							volume: template.volume,
							continuous: template.continuous,
							durability: template.durability,
							abundance: template.abundance,
							flags: template.flags,
							assets: template.assets,
						});
						inventory.addComponent("identity", {
							name: template.name,
							description: template.description,
						});
						ctx.flight.ecs.addEntity(inventory);
					});
				});
				// Add inventory entities to their appropriate system
				ctx.flight.ecs.cleanDirtyEntities();
				// Spawn the ships that were defined when the flight was started
				for (const ship of ships) {
					const shipTemplate = activePlugins.reduce(
						(acc: ShipPlugin | null, plugin) => {
							if (acc) return acc;
							if (plugin.id !== ship.shipTemplate.pluginId) return acc;
							return (
								plugin.aspects.ships.find(
									(pluginShip) => pluginShip.name === ship.shipTemplate.shipId,
								) || null
							);
						},
						null,
					);
					if (!shipTemplate) continue;
					let position: Zod.infer<typeof positionComponent> = {
						x: 0,
						y: 0,
						z: 0,
						type: "interstellar",
						parentId: null,
					};
					if (startingPoint) {
						const startingPointPosition = findStartingPoint(
							ctx.flight.ecs,
							startingPoint,
							solarSystemMap,
						);
						if (startingPointPosition) position = startingPointPosition;
					}
					const { ship: shipEntity, extraEntities } = spawnShip(
						ctx,
						shipTemplate,
						{
							name: ship.shipName,
							position,
							tags: ["player"],
							playerShip: true,
						},
					);

					extraEntities.forEach((s) => ctx.flight?.ecs.addEntity(s));
					let theme = ship.theme || null;
					if (!theme) {
						theme = activePlugins.reduce(
							(acc: { pluginId: string; themeId: string } | null, plugin) => {
								if (acc) return acc;
								const theme = plugin.aspects?.themes?.filter(
									(theme) => theme.default,
								)[0];
								if (!theme) return null;
								return { pluginId: plugin.id, themeId: theme.name };
							},
							null,
						);
					}
					if (theme) {
						shipEntity.addComponent("theme", theme);
					}

					// First see if there is a station complement
					// that matches the specific one that was passed in
					const stationComplement = getStationComplement(activePlugins, ship);
					shipEntity.addComponent("stationComplement", {
						stations:
							stationComplement?.stations.map((s) => ({
								...s,
								logo: stationComplement?.assets[`${s.name}-logo`] || "",
								cards: s.cards.map((c) => {
									return {
										...c,
										icon: stationComplement?.assets[`${s.name}-${c.name}-icon`],
									};
								}),
								widgets: s.widgets?.map((w) => {
									return {
										...w,
										icon:
											w.icon ||
											stationComplement?.assets[`${s.name}-${w.name}-icon`],
									};
								}),
							})) || [],
					});

					ctx.flight.ecs.addEntity(shipEntity);
				}
				// Add the mission if it exists
				if (missionId) {
					triggerSend("timeline.activate", {
						pluginId: missionId.pluginId,
						timelineId: missionId.missionId,
					});
				}
				ctx.server.activeFlightName = flightName;
				pubsub.publish.flight.active();
				pubsub.publish.flight.all();
				return ctx.flight;
			},
		),
	stop: t.procedure.send(({ ctx }) => {
		inputAuth(ctx);

		// Save the flight, but don't delete it.
		if (!ctx.flight) return null;
		ctx.flight.paused = false;

		ctx.flight.writeFile();

		try {
			ctx.flight.destroy();
		} catch (err) {
			console.error(err);
		}
		ctx.flight = null;
		ctx.server.activeFlightName = null;
		// TODO September 1, 2021 - Stop broadcasting this flight with Bonjour.
		pubsub.publish.flight.active();
		return null;
	}),
	load: t.procedure
		.input(z.object({ flightName: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			if (ctx.flight) return ctx.flight;

			ctx.flight = new FlightDataModel(
				{
					entities: [],
					initialLoad: false,
					serverDataModel: ctx.server,
				},
				{ path: `/flights/${input.flightName}.flight` },
			);
			await ctx.flight.initEcs(ctx.server);
			await ctx.flight.initPhysics();

			ctx.server.activeFlightName = input.flightName;
			pubsub.publish.flight.active();
			return ctx.flight;
		}),
	delete: t.procedure
		.input(z.object({ name: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			if (ctx.flight?.name === input.name) {
				ctx.flight = null;
				ctx.server.activeFlightName = null;
			}
			try {
				await fs.unlink(`${thoriumPath}/flights/${input.name}.flight`);
			} catch {
				// Do nothing; the file probably didn't exist.
			}
			pubsub.publish.flight.active();
			pubsub.publish.flight.all();
			return null;
		}),
	pause: t.procedure.send(({ ctx }) => {
		if (ctx.flight) {
			ctx.flight.paused = true;
			pubsub.publish.flight.active();
		}
		return ctx.flight;
	}),
	resume: t.procedure.send(({ ctx }) => {
		if (ctx.flight) {
			ctx.flight.paused = false;
			pubsub.publish.flight.active();
		}
		return ctx.flight;
	}),
	reset: t.procedure.send(({ ctx }) => {
		ctx.flight?.reset();
		pubsub.publish.flight.active();
		return ctx.flight;
	}),
});

function findStartingPoint(
	ecs: ECS,
	startingPoint: { pluginId: string; solarSystemId: string; objectId: string },
	solarSystemMap: Record<string, Entity>,
) {
	try {
		if (!startingPoint) throw new Error("No starting point");
		const key = `${startingPoint.pluginId}-${startingPoint.solarSystemId}-${startingPoint.objectId}`;
		const startingEntity = solarSystemMap[key];
		if (!startingEntity) throw new Error(`Could not find entity for ${key}`);
		if (!startingEntity.components.satellite)
			throw new Error(`${key} is not a satellite`);
		let origin = new Vector3();
		if (startingEntity.components.satellite.parentId) {
			const parent = ecs.getEntityById(
				startingEntity.components.satellite.parentId,
			);
			if (parent?.components.satellite)
				origin = getOrbitPosition(parent.components.satellite);
		}
		const objectPosition = startingEntity.components?.position ||
			(startingEntity.components?.satellite &&
				getOrbitPosition({
					...startingEntity.components.satellite,
					origin,
				})) || {
				x: -0.5 * Math.random() * 100000000,
				y: -0.5 * Math.random() * 10000,
				z: -0.5 * Math.random() * 100000000,
			};
		const startObjectScale =
			startingEntity.components?.isPlanet?.radius ||
			(startingEntity.components.size &&
				Math.max(
					startingEntity.components.size.height,
					startingEntity.components.size.length,
					startingEntity.components.size.width,
				) / 1000) ||
			1;
		const distanceVector = new Vector3(
			startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale,
			0,
			startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale,
		);
		const parentSystem = getPlanetSystem(ecs, startingEntity);
		return {
			x: objectPosition.x + distanceVector.x,
			y: objectPosition.y,
			z: objectPosition.z + distanceVector.z,
			type: "solar" as const,
			parentId: parentSystem.id,
		};
		// TODO May 18 2022 Once docking gets sorted out, make it so the ship can start out docked with a starbase.
	} catch (e) {
		if (e instanceof Error) {
			console.error(e);
		}
	}
}
