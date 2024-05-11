import { Vector3 } from "three";

export function seek(position: Vector3, target: Vector3) {
	// This is the desired velocity
	return target.sub(position).normalize();
}
export function flee(position: Vector3, target: Vector3) {
	// This is the desired velocity
	return position.sub(target).normalize();
}
export function arrival(position: Vector3, target: Vector3, maxSpeed: number) {
	const distance = target.sub(position).length();
	const speed = distance / maxSpeed;
	return seek(position, target).multiplyScalar(speed);
}
export function pursue(
	position: Vector3,
	target: Vector3,
	targetVelocity: Vector3,
	t: number,
) {
	const futurePosition = estimateFuturePosition(target, targetVelocity, t);
	return seek(position, futurePosition);
}
export function evade(
	position: Vector3,
	target: Vector3,
	targetVelocity: Vector3,
	t: number,
) {
	const futurePosition = estimateFuturePosition(target, targetVelocity, t);
	return flee(position, futurePosition);
}

const tempVector = new Vector3();
export function wander(
	position: Vector3,
	velocity: Vector3,
	wanderDistance: number,
	wanderRadius: number,
	{ lat, lon }: { lat: number; lon: number },
) {
	const wanderPoint = velocity
		.normalize()
		.multiplyScalar(wanderDistance)
		.add(position);

	const displaceRange = 0.2;
	lat += Math.random() * displaceRange - displaceRange / 2;
	lon += Math.random() * displaceRange - displaceRange / 2;

	const x = wanderRadius * Math.sin(lat) * Math.cos(lon);
	const y = wanderRadius * Math.sin(lat) * Math.sin(lon);
	const z = wanderRadius * Math.cos(lat);
	wanderPoint.add(tempVector.set(x, y, z));

	return { desiredVelocity: seek(position, wanderPoint), offset: { lat, lon } };
}

function estimateFuturePosition(
	position: Vector3,
	velocity: Vector3,
	time: number,
) {
	return position.clone().add(velocity.clone().multiplyScalar(time));
}
