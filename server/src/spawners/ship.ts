import { Entity } from "../utils/ecs";
import type ShipPlugin from "../classes/Plugins/Ship";
import type { position } from "../components/position";
import { randomFromList } from "../utils/randomFromList";
import { generateShipInventory } from "./inventory";
import type { FlightDataModel } from "../classes/FlightDataModel";
import type { ServerDataModel } from "../classes/ServerDataModel";
import { greekLetters } from "../utils/constantStrings";
import { spawnShipSystem } from "./shipSystem";
import ReactorPlugin from "@server/classes/Plugins/ShipSystems/Reactor";
import type BaseShipSystemPlugin from "@server/classes/Plugins/ShipSystems/BaseSystem";
import { getInventoryTemplates } from "@server/utils/getInventoryTemplates";
import { getPowerSupplierPowerNeeded } from "@server/systems/ReactorFuelSystem";
import { Box3, Vector3 } from "three";
import { loadGltf } from "@server/utils/loadGltf";
import { thoriumPath } from "@server/utils/appPaths";
import { capitalCase } from "change-case";
import path from "node:path";
import { mergeDeep } from "@server/utils/mergeDeep";
import type PhasersPlugin from "@server/classes/Plugins/ShipSystems/Phasers";
import { phasers } from "@client/data/plugins/systems/phasers";

const systemCache: Record<string, BaseShipSystemPlugin> = {};
function getSystem(
	dataContext: { flight: FlightDataModel | null; server: ServerDataModel },
	systemId: string,
	pluginId: string,
) {
	if (!systemCache[`${systemId}-${pluginId}`]) {
		const plugin = dataContext.server.plugins.find(
			(plugin) => pluginId === plugin.id,
		);
		const systemPlugin = plugin?.aspects.shipSystems.find(
			(sys) => sys.name === systemId,
		);
		if (!systemPlugin) return undefined;
		systemCache[`${systemId}-${pluginId}`] = systemPlugin;
	}
	return systemCache[`${systemId}-${pluginId}`];
}
export async function spawnShip(
	dataContext: { flight: FlightDataModel | null; server: ServerDataModel },
	template: Partial<ShipPlugin>,
	params: {
		name?: string;
		description?: string;
		registry?: string;
		position?: Zod.infer<typeof position>;
		tags?: string[];
		assets?: Partial<InstanceType<typeof ShipPlugin>["assets"]>;
		playerShip?: boolean;
	},
) {
	if (!dataContext.flight) throw new Error("No flight has been started.");
	const inventoryTemplates = getInventoryTemplates(dataContext.flight?.ecs);

	const entity = new Entity();
	const shipId = entity.id;

	entity.addComponent("identity", {
		name: params.name || template.name,
		description: template.description,
	});
	entity.addComponent("tags", {
		tags: (template.tags ?? []).concat(params.tags ?? []),
	});
	// TODO November 16, 2021 - write a function to generate registry numbers. Maybe based off the faction.
	entity.addComponent("isShip", {
		category: template.category,
		registry: params.registry || "",
		shipClass: template.name,
		assets: {
			...template.assets,
			...params.assets,
		},
	});
	// TODO September 3, 2024 - Make this configurable on the ship template
	entity.addComponent("hull", { hull: 10 });
	if (params.position) {
		entity.addComponent("position", params.position);
	}
	entity.addComponent("rotation");
	entity.addComponent("velocity");
	entity.addComponent("rotationVelocity");

	const size = await getMeshSize(
		template.assets?.model
			? path.join(
					thoriumPath.startsWith("/") ? "" : ".",
					thoriumPath,
					template.assets!.model,
			  )
			: null,
	);
	size.multiplyScalar(template.length || 1);
	entity.addComponent("size", {
		length: size.z,
		width: size.x,
		height: size.y,
	});

	entity.addComponent("mass", { mass: template.mass });

	entity.addComponent("shipSystems");
	entity.addComponent("nearbyObjects", { objects: new Map() });

	const systemEntities: Entity[] = [];
	let phaseCapacitorCount = 0;
	template.shipSystems?.forEach((system) => {
		const systemPlugin = getSystem(
			dataContext,
			system.systemId,
			system.pluginId,
		);
		if (!systemPlugin) return;
		switch (systemPlugin.type) {
			case "reactor":
				// Reactors are special, so take care of them later.

				break;
			case "battery": {
				if (params.playerShip) {
					const entity = spawnShipSystem(
						shipId,
						systemPlugin,
						system.overrides,
					);
					if (entity.components.isBattery) {
						entity.components.isBattery.storage =
							entity.components.isBattery.capacity;
					}
					systemEntities.push(entity);
				}

				break;
			}
			case "shields": {
				// Create enough shield systems for each shield
				const shieldDirections = [
					"fore",
					"aft",
					"port",
					"starboard",
					"dorsal",
					"ventral",
				];
				const shieldCount =
					system.overrides?.shieldCount ||
					("shieldCount" in systemPlugin && systemPlugin.shieldCount) ||
					1;
				for (let i = 0; i < shieldCount; i++) {
					const entity = spawnShipSystem(shipId, systemPlugin, {
						...system.overrides,
						direction: shieldDirections[i],
					});
					if (shieldCount > 1) {
						entity.updateComponent("identity", {
							name: `${capitalCase(shieldDirections[i])} ${
								entity.components.identity?.name || "Shields"
							}`,
						});
					}
					systemEntities.push(entity);
				}
				break;
			}
			case "phasers": {
				phaseCapacitorCount += 1;
				const phaser = spawnShipSystem(shipId, systemPlugin, system.overrides);
				systemEntities.push(phaser);

				if (params.playerShip) {
					const capacitor = spawnShipSystem(shipId, { type: "battery" }, {});
					capacitor.updateComponent("identity", {
						name: `Phase Capacitor ${phaseCapacitorCount}`,
					});
					capacitor.addComponent("isPhaseCapacitor");
					capacitor.updateComponent("isBattery", {
						storage: 0,
						// TODO: Make this configurable
						capacity: 1,
						outputRate: phaser.components.power?.defaultPower || 1,
						chargeRate: phaser.components.power?.requiredPower || 1,
					});
					systemEntities.push(capacitor);
					phaser.updateComponent("power", {
						powerSources: Array.from({
							length: phaser.components.power?.defaultPower || 0,
						}).map(() => capacitor.id),
					});
				}

				break;
			}
			default: {
				// TODO: Set up power from reactors and batteries
				const entity = spawnShipSystem(shipId, systemPlugin, system.overrides);
				systemEntities.push(entity);
				break;
			}
		}
	});

	// Now let's power up the reactors
	const totalPower = systemEntities.reduce((prev, next) => {
		return prev + (next.components.power?.defaultPower || 0);
	}, 0);
	if (params.playerShip) {
		const reactorCount =
			template.shipSystems?.reduce((prev, system) => {
				const systemPlugin = getSystem(
					dataContext,
					system.systemId,
					system.pluginId,
				);
				if (systemPlugin instanceof ReactorPlugin) {
					return (
						prev + (system.overrides?.reactorCount || systemPlugin.reactorCount)
					);
				}
				return prev;
			}, 0) || 1;

		// Split amongst the reactors and generously make it a nice round number
		const reactorPower = Math.ceil(totalPower / reactorCount / 10) * 10;

		template.shipSystems?.forEach((system) => {
			const systemPlugin = getSystem(
				dataContext,
				system.systemId,
				system.pluginId,
			);
			if (systemPlugin instanceof ReactorPlugin) {
				Array.from({ length: systemPlugin.reactorCount }).forEach(() => {
					const sys = spawnShipSystem(shipId, systemPlugin, system.overrides);
					const maxOutput = reactorPower * systemPlugin.powerMultiplier;
					sys.updateComponent("isReactor", {
						maxOutput,
						currentOutput: maxOutput * systemPlugin.optimalOutputPercent,
						optimalOutputPercent: systemPlugin.optimalOutputPercent,
					});
					systemEntities.push(sys);
				});
			}
		});

		// Make sure each system and battery has a reactor to charge it
		systemEntities.forEach((entity) => {
			if (entity.components.isBattery) {
				const reactors = systemEntities.filter(
					(e) =>
						e.components.isReactor &&
						getPowerSupplierPowerNeeded(e) < e.components.isReactor.maxOutput,
				);
				// Don't fill up phase capacitors, since that basically equates to
				// having the phasers charged immediately
				if (entity.components.isPhaseCapacitor) {
					return;
				}
				const reactor = randomFromList(reactors);
				if (!reactor) return;
				entity.updateComponent("isBattery", {
					powerSources: [
						...entity.components.isBattery.powerSources,
						reactor.id,
					],
				});
			}
			if (entity.components.power) {
				if (entity.components.isPhasers) {
					// Phasers are powered by phase capacitors, skip
					return;
				}
				for (let i = 0; i < entity.components.power.defaultPower; i++) {
					const reactors = systemEntities.filter(
						(e) =>
							e.components.isReactor &&
							getPowerSupplierPowerNeeded(e) < e.components.isReactor.maxOutput,
					);
					const reactor = randomFromList(reactors);
					if (!reactor) return;
					entity.updateComponent("power", {
						powerSources: [...entity.components.power.powerSources, reactor.id],
					});
				}
			}
		});
	}

	systemEntities.forEach((e) => {
		entity.components.shipSystems?.shipSystems.set(e.id, {});
	});

	// Now we can add the ship to the ECS
	if (params.playerShip) {
		entity.addComponent("isPlayerShip");
		entity.addComponent("physicsWorld");
	} else {
		entity.addComponent("shipBehavior", {
			objective: "hold",
			target: entity.components.position,
			destination: entity.components.position,
		});
		entity.addComponent("autopilot");
	}
	const extraEntities: Entity[] = [];
	// Initialize the ship map. For now, we'll just load the ship map onto a component of the ship.
	// In the future, rooms themselves might become entities.
	if (
		entity.components.isPlayerShip &&
		template.decks &&
		template.decks?.length > 0
	) {
		const deckNodes =
			template.decks?.flatMap((deck, i) =>
				deck.nodes.map((n) => ({ ...n, deckIndex: i, contents: {} })),
			) || [];
		generateShipInventory(
			deckNodes.map((node) => ({
				id: node.id,
				contents: node.contents,
				flags: node.flags,
				volume: node.volume,
				systems: node.systems,
			})),
			inventoryTemplates,
			{
				powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours
			},
		);

		entity.addComponent("shipMap", {
			decks: template.decks || [],
			deckNodes,
			deckEdges: template.deckEdges || [],
		});

		// Place cargo containers
		Array.from({ length: template.cargoContainers || 0 }).forEach((_, i) => {
			// TODO June 24, 2022: Maybe make this use the ECS PRNG
			const randomRoom = randomFromList(deckNodes.filter((n) => n.isRoom));
			if (!randomRoom) return;
			const cargoContainer = new Entity();
			cargoContainer.addComponent("identity", {
				name: `Container ${greekLetters[i]}${i > 25 ? i : ""}`,
			});
			cargoContainer.addComponent("cargoContainer", {
				volume: template.cargoContainerVolume || 1,
			});
			cargoContainer.addComponent("position", {
				x: randomRoom.x,
				y: randomRoom.y,
				z: randomRoom.deckIndex,
				type: "ship",
				parentId: entity.id,
			});
			cargoContainer.addComponent("passengerMovement", {
				destinationNode: randomRoom.id,
			});
			extraEntities.push(cargoContainer);
		});
	} else {
		// Give the ship some cargo space without creating any rooms
		entity.addComponent("cargoContainer", {
			// TODO June 24, 2022: Make this a configurable value
			volume: 500,
		});
		generateShipInventory(
			[
				{
					id: entity.id,
					contents: entity.components.cargoContainer?.contents || {},
					flags: ["cargo"],
					volume: entity.components.cargoContainer?.volume || 500,
					systems: [],
				},
			],
			inventoryTemplates,
			{
				powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours, so we have enough for a 2.5 hour trip
			},
		);
	}

	// With the deck map initialized, we can now assign rooms to systems
	let occupiedRooms: number[] = [];
	for (const [id, info] of entity.components.shipSystems?.shipSystems || []) {
		const system = systemEntities.find((sys) => sys.id === id);
		const systemType = system?.components.isShipSystem?.type;
		if (!systemType) continue;
		const availableRooms =
			entity.components.shipMap?.deckNodes.filter((node) =>
				node.systems?.includes(systemType),
			) || [];

		if (occupiedRooms.length === availableRooms.length) {
			occupiedRooms = [];
		}
		availableRooms.filter((a) => !occupiedRooms.includes(a.id));

		const roomAssignment = randomFromList(availableRooms);
		if (!roomAssignment) continue;
		occupiedRooms.push(roomAssignment.id);
		entity.components.shipSystems?.shipSystems.set(id, {
			...info,
			roomId: roomAssignment.id,
		});
	}

	return { ship: entity, extraEntities: systemEntities.concat(extraEntities) };
}

async function getMeshSize(url: string | null): Promise<Vector3> {
	if (!url) return new Vector3(1, 1, 1);
	const gltf = await loadGltf(url);
	if (!gltf) return new Vector3();
	const box = new Box3().setFromObject(gltf.scene.children[0]);

	return box.getSize(new Vector3());
}
