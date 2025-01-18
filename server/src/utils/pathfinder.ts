import { solarSystemsObjects } from "@server/systems/SolarSystemPositionSystem";
import type { Entity } from "@server/utils/ecs";
import {
	CatmullRomCurve3,
	Mesh,
	type Object3D,
	Raycaster,
	Vector3,
} from "three";

const raycaster = new Raycaster();
const position = new Vector3();
const direction = new Vector3();
export function pathfinder(entity: Entity, targetPosition: Vector3) {
	if (
		!entity.components.position ||
		entity.components.position.parentId === null
	)
		return;
	// First, set up our raycaster
	position.set(
		entity.components.position.x,
		entity.components.position.y,
		entity.components.position.z,
	);

	direction.copy(targetPosition).sub(position).normalize();

	raycaster.set(position, direction);

	raycaster.near = 0;
	raycaster.far = position.distanceTo(targetPosition);

	// Cast it into our scene
	const solarSystemScene = solarSystemsObjects.get(
		entity.components.position.parentId,
	);
	const objects = [...(solarSystemScene?.values() || [])];

	const path = calculatePath(
		position,
		targetPosition,
		objects
			.filter((o) => o.entityId !== entity.id)
			.map((o) => ({
				entityId: o.entityId,
				distance: o.position.distanceToSquared(position),
				position: o.position,
				radius: o.radius,
			})),
	);
	return path.map(({ x, y, z }) => ({ x, y, z }));
}

type Obstacle = {
	entityId: number;
	position: Vector3;
	radius: number;
	distance: number;
};

function calculatePath(start: Vector3, end: Vector3, obstacles: Obstacle[]) {
	const path = [start];
	let current = start;
	obstacles.sort((a, b) => a.distance - b.distance);
	let previousObstacle = obstacles[0];
	for (const obstacle of obstacles) {
		const collision = detectCollision(current, end, obstacle);
		if (collision) {
			const tangents = calculateTangents(current, obstacle);
			const detour = chooseBestTangent(tangents, end);
			// We need to make sure there isn't a collision going the opposite direction with the previous obstacle
			const prevPoint = path.at(-1)!;
			const backwardsCollision = detectCollision(
				prevPoint,
				detour,
				previousObstacle,
			);
			if (backwardsCollision) {
				const tangents = calculateTangents(prevPoint, previousObstacle);
				const backwardsDetour = chooseBestTangent(tangents, detour);
				path.push(backwardsDetour);
			}
			path.push(detour);
			current = detour;
		}
		previousObstacle = obstacle;
	}

	path.push(end);
	return smoothPath(path);
}

function detectCollision(
	point1: Vector3,
	point2: Vector3,
	obstacle: Obstacle,
): boolean {
	// Calculate direction vector of the line
	const dx = point2.x - point1.x;
	const dy = point2.y - point1.y;
	const dz = point2.z - point1.z;

	// Vector from line start to sphere center
	const cx = obstacle.position.x - point1.x;
	const cy = obstacle.position.y - point1.y;
	const cz = obstacle.position.z - point1.z;

	// Length of direction vector
	const lengthSquared = dx * dx + dy * dy + dz * dz;

	// Early exit if points are the same
	if (lengthSquared < Number.EPSILON) {
		// Check if point1 is inside sphere
		const distSquared = cx * cx + cy * cy + cz * cz;
		return distSquared <= obstacle.radius * obstacle.radius;
	}

	// Project c onto d to find the closest point on the line to the sphere center
	const dot = (cx * dx + cy * dy + cz * dz) / lengthSquared;

	// Find the closest point on the line to the sphere center
	const closestX = point1.x + dot * dx;
	const closestY = point1.y + dot * dy;
	const closestZ = point1.z + dot * dz;

	// Calculate distance from closest point to sphere center
	const distX = obstacle.position.x - closestX;
	const distY = obstacle.position.y - closestY;
	const distZ = obstacle.position.z - closestZ;
	const distSquared = distX * distX + distY * distY + distZ * distZ;

	// If closest point is further than radius, no intersection
	if (distSquared > obstacle.radius * obstacle.radius) {
		return false;
	}

	// Check if closest point lies within the line segment
	return dot >= 0 && dot <= 1;
}

function calculateTangents(point: Vector3, obstacle: Obstacle) {
	// Input:
	// point: THREE.Vector3 - the current position of the object navigating
	// obstacle: { position: THREE.Vector3, radius: number } - sphere obstacle

	const obstacleCenter = obstacle.position;
	const radius = obstacle.radius;

	// Vector from the point to the center of the sphere
	const toCenter = obstacleCenter.clone().sub(point);
	const distanceToCenter = toCenter.length();

	// Check if the point is inside the obstacle
	if (distanceToCenter <= radius) {
		throw new Error("Point is inside or too close to the obstacle");
	}

	// Calculate the tangent distance
	const tangentDistance = Math.sqrt(distanceToCenter ** 2 - radius ** 2);

	// Unit vector pointing from the point to the sphere center
	const toCenterNormalized = toCenter.clone().normalize();

	// Find perpendicular vector to `toCenterNormalized` in 3D space
	const perp = new Vector3().crossVectors(
		toCenterNormalized,
		new Vector3(0, 1, 0),
	);
	if (perp.lengthSq() === 0) {
		// Handle edge case where `toCenterNormalized` is collinear with the Y-axis
		perp.crossVectors(toCenterNormalized, new Vector3(1, 0, 0));
	}
	perp.normalize();

	// Compute two tangent directions
	const tangent1 = toCenterNormalized
		.clone()
		.multiplyScalar(tangentDistance)
		.add(perp.clone().multiplyScalar(radius + radius * 0.5));
	const tangent2 = toCenterNormalized
		.clone()
		.multiplyScalar(tangentDistance)
		.sub(perp.clone().multiplyScalar(radius + radius * 0.5));

	// Translate tangents to actual points in space
	const tangentPoint1 = point.clone().add(tangent1);
	const tangentPoint2 = point.clone().add(tangent2);

	return [tangentPoint1, tangentPoint2];
}

function chooseBestTangent(tangents: Vector3[], end: Vector3) {
	// Choose the tangent point that aligns best with the path direction
	return tangents.reduce(
		(best, tangent) => {
			const score = tangent.clone().sub(end).length();
			return score < best.score ? { point: tangent, score } : best;
		},
		{ score: Number.POSITIVE_INFINITY, point: new Vector3() },
	).point;
}

function smoothPath(path: Vector3[]) {
	// Smooth the path for a natural trajectory
	const curve = new CatmullRomCurve3(path);
	// This is a nice balance of smoothness.
	return curve.getPoints(path.length * 4);
}
