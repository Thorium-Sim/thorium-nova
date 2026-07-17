import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import type ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type StationComplementPlugin from "@thorium/.server/classes/Plugins/StationComplement";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { spawnShip } from "@thorium/.server/spawners/ship";
import { spawnSolarSystem } from "@thorium/.server/spawners/solarSystem";
import { isPanelElement } from "@thorium/ecs-components/engineeringPanel";
import {
	panelElementList,
	type PanelElementTypes,
} from "@thorium/ecs-components/engineeringPanelElementConfig";
import type { position as positionComponent } from "@thorium/ecs-components/position";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { getPluginTextPatterns, interpolateText } from "@thorium/utils/interpolationEngine";
import { createRNG, type RNG } from "@thorium/utils/rng";
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
	ctx.flight = await FlightDataModel.create(
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

		// Generate Engineering panels for any cards that need them
		for (const station of shipEntity.components.stationComplement?.stations || []) {
			for (const card of station.cards) {
				if (card.component === "EngineeringPanels") {
					const panel = new Entity();

					panel.addComponent("isPanel", { shipId: shipEntity.id });
					if (card.config?.tags) {
						panel.addComponent("tags", { tags: card.config.tags });
					}
					ctx.flight.ecs.addEntity(panel);

					card.config = { ...card.config, panelId: panel.id };
					if ("config" in card && card.config && "elements" in card.config) {
						for (const { name, ...element } of card.config.elements.slice(0, 24)) {
							const elementEntity = new Entity();
							elementEntity.addComponent("identity", { name });
							elementEntity.addComponent("isPanelElement", {
								panelId: panel.id,
								shipId: shipEntity.id,
								element,
							});
							ctx.flight.ecs.addEntity(elementEntity);
						}
					} else {
						let config = Object.assign(
							{
								elementCount: 12,
								elementNameTemplate: `{~A,B,C,D,E}{~A,B,C,D,E}-RANDOM(10,99)`,
								randomSeed: ctx.flight.ecs.rng.nextString(),
							},

							card.config,
						);
						const rng = createRNG(config.randomSeed);
						const filteredTypes: PanelElementTypes[] = [];
						const includedTypes: PanelElementTypes[] = [];
						const elementCount = Math.min(config.elementCount, 24);

						function addElement(
							type: PanelElementTypes = rng.nextFromList(
								panelElementList.filter((v) => !filteredTypes.includes(v)),
							),
						) {
							const elementEntity = new Entity();
							elementEntity.addComponent("identity", {
								name: interpolateText(
									config.elementNameTemplate,
									{},
									getPluginTextPatterns(ctx.server),
									rng,
								),
							});
							elementEntity.addComponent("isPanelElement", {
								panelId: panel.id,
								shipId: shipEntity.id,
								element: getPanelElement(type, rng),
							});
							ctx.flight!.ecs.addEntity(elementEntity);
							includedTypes.push(type);
							return type;
						}
						for (let i = 0; i < elementCount; i++) {
							const type = addElement();
							if (
								i < elementCount - 1 &&
								type === "cableSocket" &&
								includedTypes.filter((i) => i === "cableSocket").length < 4
							) {
								// Add another cable socket, just to add more variety
								addElement("cableSocket");
							}

							// Remove element types as necessary
							// Only one keypad
							if (type === "numberPad") filteredTypes.push(type);
							// No more than 20% of the panel should be one type
							if (includedTypes.filter((v) => v === type).length >= elementCount / 5)
								filteredTypes.push(type);
						}
					}
				}
			}
		}

		ctx.flight.ecs.addEntity(shipEntity);
	}
	// Add the mission if it exists
	if (missionId) {
		await ctx.ecs.triggerAction("timeline.activate", {
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
			await ctx.ecs.executeBlocks(macro.blocks);
		}
	}

	ctx.server.activeFlightName = flightName;
	pubsub.publish.flight.active();
	pubsub.publish.flight.all();
	await ctx.flight.write(true);

	return ctx.flight;
}

function getPanelElement(
	type: z.infer<typeof isPanelElement>["element"]["type"],
	rng: RNG,
): z.infer<typeof isPanelElement>["element"] {
	switch (type) {
		case "triSwitch":
		case "numberPad":
			return { type };
		case "pressButton":
		case "switch":
			return {
				type,
				color: rng.nextFromList([
					"red",
					"orange",
					"yellow",
					"#00ff00",
					"cyan",
					"blue",
					"rebeccapurple",
				]),
			};
		case "cableSocket":
			// Even integer
			return { type, ports: rng.nextInt(2, 5) * 2 };
		// case "numberedRotor":
		// 	return { type, max: 6 };
		case "numberedSlider":
			return { type, max: rng.nextInt(4, 8) };
		default:
			const typeName = type;
			typeName satisfies never;
			throw new Error("Invalid panel element type");
	}
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
