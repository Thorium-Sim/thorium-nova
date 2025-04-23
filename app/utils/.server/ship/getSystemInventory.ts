import type { Entity } from "@thorium/utils/ecs";
import { getDeckNode } from "./getDeckNode";
import { getInventoryTemplates } from "../getInventoryTemplates";

/**
 * Get the inventory currently located in the room associated with this reactor
 * @param reactor - An ECS entity
 * @returns
 */
export function getReactorInventory(reactor: Entity) {
	let systemShip: Entity | null = null;
	for (const system of reactor.ecs?.systems || []) {
		if (system.constructor.name === "FilterShipsWithReactors") {
			for (const [id, ship] of system.entities || []) {
				if (ship.components.shipSystems?.shipSystems.has(reactor.id)) {
					systemShip = ship;
					break;
				}
			}
		}
	}

	if (!systemShip) return null;

	const entityRoomId = systemShip.components.shipSystems?.shipSystems.get(
		reactor.id,
	)?.roomId;
	const entityRoom = getDeckNode(entityRoomId, systemShip);

	const inventoryTemplates = getInventoryTemplates(reactor.ecs);
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
