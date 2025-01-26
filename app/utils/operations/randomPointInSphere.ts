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

export function randomPointOnSphere(radius = 1) {
	const [x, y, z] = [
		generateGaussian(),
		generateGaussian(),
		generateGaussian(),
	];
	const normalized = Math.sqrt(x * x + y * y + z * z);
	return [
		(x / normalized) * radius,
		(y / normalized) * radius,
		(z / normalized) * radius,
	] as const;
}

function generateGaussian() {
	let u = 0;
	let v = 0;
	// Converting [0,1) to (0,1) to avoid log(0) error
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();

	return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
