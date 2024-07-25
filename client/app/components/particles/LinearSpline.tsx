import { Vector3, Color } from "three";

// https://github.com/simondevyoutube/ThreeJS_Tutorial_ParticleSystems/blob/master/main.js
// MIT Copyright (c) 2020 simondevyoutube
const lerpVector = new Vector3();
const lerpColor = new Color();
function defaultLerp<T>(a: T, b: T, t: number) {
	if (typeof a === "number" && typeof b === "number")
		return (a + t * (b - a)) as T;
	if (a instanceof Vector3 && b instanceof Vector3)
		return lerpVector.lerpVectors(a, b, t) as T;
	if (a instanceof Color && b instanceof Color)
		return lerpColor.lerpColors(a, b, t) as T;

	throw new Error("No lerp function provided");
}
export class LinearSpline<T> {
	private points: [number, T][];
	private lerp: (a: T, b: T, t: number) => T;
	constructor({
		points,
		lerp,
	}: { points?: [number, T][]; lerp?: (a: T, b: T, t: number) => T }) {
		this.points = points || [];
		this.lerp = lerp!;
		if (!this.lerp) {
			this.lerp = defaultLerp;
		}
	}

	addPoint(t: number, d: T) {
		this.points.push([t, d]);
	}

	getPoint(t: number) {
		let p1 = 0;

		for (let i = 0; i < this.points.length; i++) {
			if (this.points[i][0] >= t) {
				break;
			}
			p1 = i;
		}

		const p2 = Math.min(this.points.length - 1, p1 + 1);

		if (p1 === p2) {
			return this.points[p1][1];
		}

		return this.lerp(
			this.points[p1][1],
			this.points[p2][1],
			(t - this.points[p1][0]) / (this.points[p2][0] - this.points[p1][0]),
		);
	}
}
