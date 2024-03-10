import type { Entity } from "./ecs";
import { getDeckNode } from "./getDeckNode";
import { getInventoryTemplates } from "./getInventoryTemplates";

/**
 * Get the inventory currently located in the room associated with this reactor
 * @param system - An ECS entity
 * @returns
 */
export function getReactorInventory(system: Entity) {
	const shipFilterSystem = system.ecs?.systems.find(
		(system) => system.constructor.name === "FilterShipsWithReactors",
	);
	const systemShip = shipFilterSystem?.entities.find((ship) =>
		ship.components.shipSystems?.shipSystems.has(system.id),
	);
	if (!systemShip) return null;

	const entityRoomId = systemShip.components.shipSystems?.shipSystems.get(
		system.id,
	)?.roomId;
	const entityRoom = getDeckNode(entityRoomId, systemShip);

	const inventoryTemplates = getInventoryTemplates(system.ecs);
	const roomInventory = Object.entries(entityRoom?.contents || {}).map(
		([key, { count, temperature }]) => {
			const inventoryItem = inventoryTemplates[key];
			return {
				room: entityRoom,
				...inventoryItem,
				count,
				temperature,
				name: key,
			};
		},
	);

	return roomInventory;
}
