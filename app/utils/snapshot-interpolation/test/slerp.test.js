import { quatSlerp } from "../src/slerp";

const quatIsEqual = (q1, q2) => {
	expect(q1.x).toBeCloseTo(q2.x, 3);
	expect(q1.y).toBeCloseTo(q2.y, 3);
	expect(q1.z).toBeCloseTo(q2.z, 3);
	expect(q1.w).toBeCloseTo(q2.w, 3);
};

test("quatSlerp 1", () => {
	const qa = { x: 0.002, y: 0.678, z: -0.226, w: -0.7 };
	const qb = { x: 0.003, y: 0.893, z: -0.298, w: 0.337 };
	let q = quatSlerp(qa, qb, 0);
	quatIsEqual(q, qa);
	q = quatSlerp(qa, qb, 1);
	quatIsEqual(q, qb);
	q = quatSlerp(qa, qb, 0.5);
	const qExpected = {
		x: 0.002949446515147865,
		y: 0.9267160950594592,
		z: -0.3091019947874962,
		w: -0.21412981699973496,
	};
	quatIsEqual(q, qExpected);
});

test("quatSlerp 2", () => {
	const qa = { x: 1, y: 1, z: 1, w: 1 };
	const qb = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
	const q = quatSlerp(qa, qb, 0.5);
	quatIsEqual(q, { x: 0.5, y: 0.5, z: 0.5, w: 0.5 });
});

test("quatSlerp 3", () => {
	const qa = { x: 0, y: 0.99999999, z: 0, w: 0 };
	const qb = { x: 0, y: 1, z: 0, w: 0 };
	const q = quatSlerp(qa, qb, 0.5);
	quatIsEqual(q, { x: 0, y: 0.9999999975, z: 0, w: 0 });
});
