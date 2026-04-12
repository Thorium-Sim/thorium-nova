import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import { spawnSolarSystem } from "@thorium/.server/spawners/solarSystem";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { z } from "zod";
import type { position as positionComponent } from "@thorium/ecs-components/position";
import { Vector3 } from "three";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { spawnShip } from "@thorium/.server/spawners/ship";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import type BridgePlugin from "@thorium/.server/classes/Plugins/Bridge";
import type { BridgeMapViewscreen } from "@thorium/.server/classes/Plugins/Bridge";
import type StationComplementPlugin from "@thorium/.server/classes/Plugins/StationComplement";
import { triggerAction } from "@thorium/utils/.server/triggerAction";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { pubsub } from "@thorium/.server/init/pubsub";
import type { DataContext } from "@thorium/.server/DataContext";
import { calculateShipMapPath } from "@thorium/utils/.server/ship/shipMapPathfinder";
import { generateSatelliteGraph } from "@thorium/cards/LongRangeComm/data.server";
import { claimBridgeFlightClient } from "@thorium/.server/init/bridgeAutoAssign";

const flightStartShips = z
	.array(
		z.object({
			crewCount: z.number(),
			shipName: z.string(),
			theme: z.object({ pluginId: z.string(), themeId: z.string() }).optional(),
			bridge: z
				.object({ pluginId: z.string(), bridgeId: z.string() })
				.optional(),
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

export const flightStartInput = z.object({
	flightName: z.string(),
	mode: z.enum(["nova", "legacy"]),
	ships: flightStartShips,
	hasFlightDirector: z.coerce.boolean(),
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
		solarSystemMap = ctx.flight.pluginIds.reduce(
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
		const { ship: shipEntity, extraEntities } = await spawnShip(
			ctx,
			shipTemplate,
			{
				name: ship.shipName,
				position,
				tags: ["player"],
				playerShip: true,
				flightMode: mode,
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
		const stationComplement = getStationComplement(mode, activePlugins, ship);
		shipEntity.addComponent("stationComplement", {
			name: stationComplement?.name || "Station Complement",
			stations: stationComplement?.stations || [],
		});

		ctx.flight.ecs.addEntity(shipEntity);

		// Create a single parent "Viewscreens" system entity that owns the shared damage
		const viewscreenSystemEntity = new Entity();
		viewscreenSystemEntity.addComponent("identity", { name: "Viewscreens" });
		viewscreenSystemEntity.addComponent("isShipSystem", {
			type: "generic",
			shipId: shipEntity.id,
		});
		viewscreenSystemEntity.addComponent("damage", {
			vulnerability: "invulnerable",
		});
		ctx.flight.ecs.addEntity(viewscreenSystemEntity);
		shipEntity.components.shipSystems?.shipSystems.set(
			viewscreenSystemEntity.id,
			{},
		);

		// Spawn viewscreen entities from bridge config, or a default if no bridge
		const bridgeConfig = ship.bridge
			? activePlugins.reduce((acc: BridgePlugin | null, plugin) => {
					if (acc || plugin.id !== ship.bridge!.pluginId) return acc;
					return (
						plugin.aspects.bridges.find(
							(b) => b.name === ship.bridge!.bridgeId,
						) || null
					);
				}, null)
			: null;

		if (bridgeConfig) {
			// Derive client assignments from floor elements — each element
			// pairs a clientName with a station (stationName or viewscreen name).
			const derived: Array<{
				clientName: string;
				stationId: string;
				isSoundPlayer: boolean;
			}> = [];
			for (const floor of bridgeConfig.floors) {
				for (const el of floor.elements) {
					if (!el.clientName) continue;
					let stationId: string | undefined;
					if (el.type === "station" && el.stationName) {
						stationId = el.stationName;
					} else if (el.type === "viewscreen" && el.viewscreenId) {
						const vs = bridgeConfig.viewscreens.find(
							(v) => v.id === el.viewscreenId,
						);
						if (vs) stationId = vs.name;
					}
					if (stationId) {
						derived.push({
							clientName: el.clientName,
							stationId,
							isSoundPlayer: false,
						});
					}
				}
			}
			shipEntity.addComponent("shipBridge", {
				clientAssignments: derived,
			});
		}

		const viewscreenStations: Array<{
			name: string;
			description: string;
			logo: string;
			theme: string;
			tags: string[];
			cards: Array<{ name: string; component: string }>;
			widgets: Array<{ name: string; component: string }>;
			messageGroups: string[];
		}> = [];

		if (bridgeConfig) {
			// Collect viewscreen elements with their config
			const viewscreenPairs: Array<{
				vs: (typeof bridgeConfig.viewscreens)[number];
				element: BridgeMapViewscreen;
			}> = [];
			for (const floor of bridgeConfig.floors) {
				for (const element of floor.elements) {
					if (element.type !== "viewscreen" || !element.viewscreenId) continue;
					const vs = bridgeConfig.viewscreens.find(
						(v) => v.id === element.viewscreenId,
					);
					if (!vs) continue;
					viewscreenPairs.push({ vs, element });
				}
			}

			for (let i = 0; i < viewscreenPairs.length; i++) {
				const { vs, element } = viewscreenPairs[i];
				const isMain = vs.isMainViewscreen ?? false;
				const name = vs.name;

				const viewscreenEntity = new Entity();
				const brokenMode = vs.brokenMode ?? "fullyBroken";
				viewscreenEntity.addComponent("isViewscreen", {
					shipId: shipEntity.id,
					name,
					tags:
						isMain && !vs.tags.includes("main-viewscreen")
							? [...vs.tags, "main-viewscreen"]
							: vs.tags,
					cameraYaw: element.rotation,
					cameraPitch: element.pitch ?? 0,
					cameraFov: vs.fov ?? 45,
					showGizmos: vs.showGizmos ?? true,
					showLayout: vs.showLayout ?? true,
					brokenMode,
					camerasOffline: false,
					viewscreenSystemId: viewscreenSystemEntity.id,
				});
				viewscreenEntity.addComponent("identity", { name });
				ctx.flight.ecs.addEntity(viewscreenEntity);

				viewscreenStations.push({
					name,
					description: "",
					logo: "",
					theme: "Default",
					tags: vs.tags,
					cards: [{ name: "Viewscreen", component: "Viewscreen" }],
					widgets: [],
					messageGroups: [],
				});
			}
		} else {
			// No bridge configured — spawn a default forward-facing main viewscreen.
			// Name must match the static "Viewscreen" station so viewscreenConfig can find it.
			const defaultViewscreen = new Entity();
			defaultViewscreen.addComponent("isViewscreen", {
				shipId: shipEntity.id,
				name: "Viewscreen",
				tags: ["main-viewscreen"],
				cameraYaw: 0,
				cameraPitch: 0,
				cameraFov: 45,
				showGizmos: true,
				showLayout: true,
				brokenMode: "fullyBroken",
				camerasOffline: false,
				viewscreenSystemId: viewscreenSystemEntity.id,
			});
			defaultViewscreen.addComponent("identity", { name: "Viewscreen" });
			ctx.flight.ecs.addEntity(defaultViewscreen);

			viewscreenStations.push({
				name: "Viewscreen",
				description: "",
				logo: "",
				theme: "Default",
				tags: ["main-viewscreen"],
				cards: [{ name: "Viewscreen", component: "Viewscreen" }],
				widgets: [],
				messageGroups: [],
			});
		}

		if (viewscreenStations.length > 0) {
			const existing = shipEntity.components.stationComplement?.stations || [];
			shipEntity.updateComponent("stationComplement", {
				stations: [...existing, ...viewscreenStations],
			});
		}
	}
	// Pre-generate bridge flightClient entities
	const playerShipCount =
		ctx.flight.ecs.componentCache.get("isPlayerShip")?.size ?? 0;
	for (const ship of ctx.flight.ecs.componentCache.get("shipBridge") || []) {
		const bridge = ship.components.shipBridge;
		if (!bridge) continue;
		const shipName = ship.components.identity?.name || "";
		for (const assignment of bridge.clientAssignments) {
			const expectedName =
				playerShipCount > 1
					? `${shipName}-${assignment.clientName}`
					: assignment.clientName;
			const entity = new Entity();
			entity.addComponent("flightClient", {
				clientId: "",
				expectedClientName: expectedName,
				flightId: ctx.flight.name,
				shipId: ship.id,
				stationId: assignment.stationId,
				bridgeAssigned: true,
				isSoundPlayer: assignment.isSoundPlayer,
			});
			ctx.flight.ecs.addEntity(entity);
		}
	}

	// Claim pre-generated entities for already-connected clients
	for (const id of Object.keys(ctx.server.clients)) {
		if (ctx.server.clients[id].connected) {
			claimBridgeFlightClient(ctx, id);
		}
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
							pluginStationComplement.flightMode === mode &&
							pluginStationComplement.stationCount === ship.crewCount,
					) || null
				);
			},
			null,
		);
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
