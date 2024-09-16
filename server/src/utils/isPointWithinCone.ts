import { Vector3 } from "three";

const apexToPoint = new Vector3();
export function isPointWithinCone(
	point: Vector3,
	cone: {
		apex: Vector3;
		/** Direction should be a vector pointing from the apex to the base whose length is the height of the cone */
		direction: Vector3;
		angle: number;
	},
): boolean {
	const axis = cone.direction.clone().normalize();

	// Calculate the vector from the point to the apex
	apexToPoint.subVectors(point, cone.apex);

	// Calculate the angle between the apex and apexToPoint
	const angleToAxis = axis.angleTo(apexToPoint);

	// Check if the angle is within the cone's angle
	if (angleToAxis > cone.angle / 2) {
		return false;
	}

	// Check if the point is in front of the cone's apex
	// This is the case if the dot product is greater than 0 (less than 0 is behind the cone's apex)
	const pointDistance = apexToPoint.dot(axis);
	const isInFrontOfAxis = pointDistance >= 0;
	const withinRange = pointDistance <= cone.direction.length();

	return isInFrontOfAxis && withinRange;
}
