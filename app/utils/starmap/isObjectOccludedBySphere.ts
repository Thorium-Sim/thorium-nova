import { Vector3, type Sphere, Ray } from "three";
const direction = new Vector3();
const ray = new Ray();
const observerPosition = new Vector3();
const objectPosition = new Vector3();

export function isObjectOccludedBySphere(
	observerPositionXYZ: { x: number; y: number; z: number },
	objectPositionXYZ: { x: number; y: number; z: number },
	obstacle: Sphere,
): boolean {
	observerPosition.set(observerPositionXYZ.x, observerPositionXYZ.y, observerPositionXYZ.z);
	objectPosition.set(objectPositionXYZ.x, objectPositionXYZ.y, objectPositionXYZ.z);

	// Create a ray from observer to object
	direction.subVectors(objectPosition, observerPosition).normalize();
	ray.set(observerPosition, direction);

	// Calculate distance to the object
	const distanceToObject = observerPosition.distanceTo(objectPosition);

	// Check for intersection with sphere
	const intersectionPoints: Vector3[] = [];
	const sphereCenter = obstacle.center;
	const sphereRadius = obstacle.radius;

	// Calculate quadratic equation coefficients
	const a = direction.dot(direction);
	const b = 2 * direction.dot(ray.origin.clone().sub(sphereCenter));
	const c =
		ray.origin.clone().sub(sphereCenter).dot(ray.origin.clone().sub(sphereCenter)) -
		sphereRadius * sphereRadius;

	// Calculate discriminant
	const discriminant = b * b - 4 * a * c;

	if (discriminant < 0) {
		// No intersection
		return false;
	}

	// Calculate intersection points
	const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
	const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

	if (t1 > 0) {
		intersectionPoints.push(ray.origin.clone().add(direction.clone().multiplyScalar(t1)));
	}

	if (t2 > 0) {
		intersectionPoints.push(ray.origin.clone().add(direction.clone().multiplyScalar(t2)));
	}

	// Check if any intersection point is between observer and object
	const isOccluded = intersectionPoints.some((point) => {
		const distanceToIntersection = observerPosition.distanceTo(point);
		return distanceToIntersection < distanceToObject;
	});

	return isOccluded;
}
