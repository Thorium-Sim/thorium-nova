// From https://karthikkaranth.me/blog/generating-random-points-in-a-sphere/
export function randomPointInSphere(radius = 1) {
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);
	const r = Math.cbrt(Math.random()) * radius;
	const sinTheta = Math.sin(theta);
	const cosTheta = Math.cos(theta);
	const sinPhi = Math.sin(phi);
	const cosPhi = Math.cos(phi);
	const x = r * sinPhi * cosTheta;
	const y = r * sinPhi * sinTheta;
	const z = r * cosPhi;
	return [x, y, z] as const;
}
