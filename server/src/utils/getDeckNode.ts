import {Entity} from "./ecs";

export function getDeckNode(id?: number, ship?: Entity) {
  if (!id) return undefined;
  if (
    ship?.components.shipMap?.deckNodeCache &&
    !ship.components.shipMap.deckNodeCache.get(id)
  ) {
    const deckNode = ship.components.shipMap.deckNodes.find(d => d.id === id);
    if (deckNode) {
      ship.components.shipMap.deckNodeCache.set(id, deckNode);
    }
  }
  return ship?.components.shipMap?.deckNodeCache.get(id);
}
