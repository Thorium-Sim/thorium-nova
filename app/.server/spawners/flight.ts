import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import type ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type StationComplementPlugin from "@thorium/.server/classes/Plugins/StationComplement";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { spawnShip } from "@thorium/.server/spawners/ship";
import { spawnSolarSystem } from "@thorium/.server/spawners/solarSystem";
import type { position as positionComponent } from "@thorium/ecs-components/position";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { triggerAction } from "@thorium/utils/.server/triggerAction";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { Vector3 } from "three";
import z from "zod";

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
			stationComplement: z.object({ pluginId: z.string(), stationId: z.string() }).optional(),
		}),
	)
	.nonempty();

export const flightStartInput = z.object({
	flightName: z.string(),
	mode: z.enum(["nova", "legacy"]),
	ships: flightStartShips,
	hasFlightDirector: z.coerce.boolean(),
	missionId: z.object({ pluginId: z.string(), missionId: z.string() }).optional(),
	startingPoint: z
		.object({
			pluginId: z.string(),
			solarSystemId: z.string(),
			objectId: z.string(),
			type: z.union([z.literal("ship"), z.literal("planet")]),
		})
		.optional(),
});

export async function startFlight(
	ctx: DataContext,
	{
		flightName,
		hasFlightDirector,
		mode,
		ships,
		missionId,
		startingPoint,
	}: z.infer<typeof flightStartInput>,
) {
	ctx.flight = new FlightDataModel(
		{
			name: flightName,
			initialLoad: true,
			entities: [],
			serverDataModel: ctx.server,
			hasFlightDirector,
			mode,
		},
		{ meta: { filePath: `/flights/${flightName}/data.yml`, flightName } },
	);
	ctx.flight.startInput = { ships, missionId, startingPoint };

	const activePlugins = ctx.server.plugins.filter((p) => p.active);
	ctx.flight.pluginIds = activePlugins.map((p) => p.id);
	await ctx.flight.initEcs(ctx.server);

	let solarSystemMap: Record<string, Entity> | null = null;
	if (mode === "nova") {
		await ctx.flight.initPhysics();

		// This will spawn all of the systems and planets bundled with the plugins
		solarSystemMap = ctx.flight.pluginIds.reduce((map: Record<string, Entity>, pluginId) => {
			const plugin = ctx.server.plugins.find((plugin) => plugin.id === pluginId);
			if (!plugin) return map;
			// Create entities for the universe objects
			plugin.aspects.solarSystems.forEach((solarSystem) => {
				const entities = spawnSolarSystem(solarSystem);
				entities.forEach((object) => {
					const { entity, key } = object;
					ctx.flight?.ecs.addEntity(entity);

					map[key] = entity;
				});
			});
			return map;
		}, {});
	}

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
		const shipTemplate = activePlugins.reduce((acc: ShipPlugin | null, plugin) => {
			if (acc) return acc;
			if (plugin.id !== ship.shipTemplate.pluginId) return acc;
			return (
				plugin.aspects.ships.find((pluginShip) => pluginShip.name === ship.shipTemplate.shipId) ||
				null
			);
		}, null);
		if (!shipTemplate) continue;

		let position: z.infer<typeof positionComponent> = {
			x: 0,
			y: 0,
			z: 0,
			type: "interstellar",
			parentId: null,
		};
		if (startingPoint && mode === "nova" && solarSystemMap) {
			const startingPointPosition = findStartingPoint(
				ctx.flight.ecs,
				startingPoint,
				solarSystemMap,
			);
			if (startingPointPosition) position = startingPointPosition;
		}
		const { ship: shipEntity, extraEntities } = await spawnShip(ctx, shipTemplate, {
			name: ship.shipName,
			position,
			tags: ["player"],
			playerShip: true,
			flightMode: mode,
		});

		extraEntities.forEach((s) => ctx.flight?.ecs.addEntity(s));
		let theme = ship.theme || null;
		if (!theme) {
			theme = activePlugins.reduce((acc: { pluginId: string; themeId: string } | null, plugin) => {
				if (acc) return acc;
				const theme = plugin.aspects?.themes?.filter((theme) => theme.default)[0];
				if (!theme) return null;
				return { pluginId: plugin.id, themeId: theme.name };
			}, null);
		}
		if (theme) {
			shipEntity.addComponent("theme", theme);
		}

		// First see if there is a station complement
		// that matches the specific one that was passed in
		const stationComplement = getStationComplement(mode, activePlugins, ship);
		shipEntity.addComponent("stationComplement", {
			name: stationComplement?.name || "Station Complement",
			stations: stationComplement?.stations || [],
		});

		ctx.flight.ecs.addEntity(shipEntity);
	}
	// Add the mission if it exists
	if (missionId) {
		triggerAction("timeline.activate", {
			pluginId: missionId.pluginId,
			timelineId: missionId.missionId,
		});
	}
	// Activate any active triggers
	for (const plugin of ctx.server.plugins) {
		if (!plugin.active) continue;
		for (const macro of plugin.aspects.macros) {
			if (!macro.active || macro.type !== "trigger") continue;
			// Execute the trigger blocks
			executeBlocks(ctx.flight.ecs, macro.blocks);
		}
	}

	ctx.server.activeFlightName = flightName;
	pubsub.publish.flight.active();
	pubsub.publish.flight.all();
	await ctx.flight.write(true);

	return ctx.flight;
}

function getStationComplement(
	mode: "nova" | "legacy",
	activePlugins: BasePlugin[],
	ship: z.infer<typeof flightStartShips>[0],
) {
	let stationComplement = activePlugins.reduce((acc: StationComplementPlugin | null, plugin) => {
		if (acc) return acc;
		if (ship.stationComplement && plugin.id !== ship.stationComplement.pluginId) return acc;
		if (ship.stationComplement) {
			return (
				plugin.aspects.stationComplements.find(
					(pluginStationComplement) =>
						pluginStationComplement.name === ship.stationComplement?.stationId,
				) || null
			);
		}
		return null;
	}, null);
	// No station complement? Find the one that best fits from the default plugin
	if (!stationComplement) {
		stationComplement = activePlugins.reduce((acc: StationComplementPlugin | null, plugin) => {
			if (acc) return acc;
			if (!plugin.default) return acc;
			// TODO November 18, 2021 - Check to see if the ship is a big ship or a little ship
			// and assign the appropriate station complement based on that.
			return (
				plugin.aspects.stationComplements.find(
					(pluginStationComplement) =>
						pluginStationComplement.flightMode === mode &&
						pluginStationComplement.stationCount === ship.crewCount,
				) || null
			);
		}, null);
	}
	return stationComplement;
}

export type FlightStartingPoint = {
	pluginId: string;
	solarSystemId: string;
	objectId: string;
	type: "planet" | "ship";
};

function findStartingPoint(
	ecs: ECS,
	startingPoint: FlightStartingPoint,
	solarSystemMap: Record<string, Entity>,
) {
	try {
		if (!startingPoint) throw new Error("No starting point");
		const key = `${startingPoint.pluginId}-${startingPoint.solarSystemId}-${startingPoint.objectId}`;
		const startingEntity = solarSystemMap[key];
		if (!startingEntity) throw new Error(`Could not find entity for ${key}`);
		if (!startingEntity.components.satellite) throw new Error(`${key} is not a satellite`);
		let origin = new Vector3();
		if (startingEntity.components.satellite.parentId) {
			const parent = ecs.getEntityById(startingEntity.components.satellite.parentId);
			if (parent?.components.satellite) origin = getOrbitPosition(parent.components.satellite);
		}
		const objectPosition = startingEntity.components?.position ||
			(startingEntity.components?.satellite &&
				getOrbitPosition({
					...startingEntity.components.satellite,
					origin,
				})) || {
				x: ecs.rng.next() * 100000000,
				y: ecs.rng.next() * 10000,
				z: ecs.rng.next() * 100000000,
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
			startObjectScale * 2 + ecs.rng.next() * startObjectScale,
			0,
			startObjectScale * 2 + ecs.rng.next() * startObjectScale,
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

function getPlanetSystem(ecs: ECS, planet: Entity): Entity {
	const parentId = planet.components?.satellite?.parentId;
	if (parentId === undefined || parentId === null) throw new Error("No satellite parentId");
	const parentEntity = ecs.getEntityById(parentId);
	if (!parentEntity)
		throw new Error(`Could not find parent entity for planet: ${JSON.stringify(planet)} `);
	if (parentEntity.components.isSolarSystem) return parentEntity;
	return getPlanetSystem(ecs, parentEntity);
}
