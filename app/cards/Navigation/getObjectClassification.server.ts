import type { Entity } from "@thorium/utils/ecs";

export function getClassification(object: Entity) {
	if (!object) return "";
	if (object.components.isPlanet)
		return `Class ${object.components.isPlanet.classification} Planet`;
	if (object.components.isStar) return `Class ${object.components.isStar.spectralType} Star`;
	if (object.components.isShip)
		return `${
			object.components.isShip.shipClass ? `${object.components.isShip.shipClass} Class ` : ""
		}${object.components.isShip.category}`;
	if (object.components.isSolarSystem) return "Solar System";
	return "";
}
