import type { Entity } from "@thorium/utils/ecs";
import { Vector3 } from "three";

import { degToRad } from "../unitTypes";

const axis = new Vector3(0, 0, 1);

export function getOrbitPosition({
	semiMajorAxis,
	eccentricity,
	orbitalArc,
	inclination,
	origin = new Vector3(),
}: OrbitPositionProps) {
	const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;
	const X = semiMajorAxis * Math.cos(degToRad(orbitalArc));
	const Z = radiusY * Math.sin(degToRad(orbitalArc));
	const vec = new Vector3(X, 0, Z);
	const angle = degToRad(inclination);

	vec.applyAxisAngle(axis, angle).add(origin);
	return vec;
}

interface OrbitPositionProps {
	semiMajorAxis: number;
	eccentricity: number;
	orbitalArc: number;
	inclination: number;
	origin?: Vector3;
}

/** Gets an objects position based on its satellite component, including if it is orbiting another satellite */
export function getCompletePositionFromOrbitClient(
	object: Pick<Entity, "components">,
	planets: Pick<Entity, "id" | "components">[],
) {
	const origin = new Vector3(0, 0, 0);
	if (object.components.satellite) {
		if (object.components.satellite.parentId) {
			const parent = planets.find((p) => p.id === object.components.satellite?.parentId);
			if (parent?.components?.satellite) {
				const parentPosition = getOrbitPosition(parent.components.satellite);
				origin.copy(parentPosition);
			}
		}
		const position = getOrbitPosition({
			...object.components.satellite,
			origin,
		});
		return position;
	}
	if (object.components.position) {
		return new Vector3(
			object.components.position.x,
			object.components.position.y,
			object.components.position.z,
		);
	}
	return new Vector3();
}
