import { isPointWithinCone } from "@server/utils/isPointWithinCone";
import { degToRad } from "@server/utils/unitTypes";
import { Vector3 } from "three";

describe("isPointWithinCone", () => {
	it("should recognize points within the cone", () => {
		expect(
			isPointWithinCone(new Vector3(1, 0, 0), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeTruthy();
	});
	it("should recognize a point on the edge of the cone", () => {
		expect(
			isPointWithinCone(new Vector3(1, 0.5, 0.5), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeTruthy();
	});
	it("should recognize a point on the front edge of the cone", () => {
		expect(
			isPointWithinCone(new Vector3(1.9, 0.5, 0.5), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeTruthy();
	});
	it("should recognize a point when the cone is pointing the other direction", () => {
		expect(
			isPointWithinCone(new Vector3(-1.9, 0, 0), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(-2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeTruthy();
	});
	it("should work when the apex is at a different position", () => {
		expect(
			isPointWithinCone(new Vector3(3, 0, 0), {
				apex: new Vector3(1, 0, 0),
				direction: new Vector3(2.5, 0, 0),
				angle: degToRad(90),
			}),
		).toBeTruthy();
	});
	it("should not recognize the point past the edge of the cone", () => {
		expect(
			isPointWithinCone(new Vector3(0, 2, 0.5), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(45),
			}),
		).toBeFalsy();
	});
	it("should not recognize a point behind the cone", () => {
		expect(
			isPointWithinCone(new Vector3(-2, 0, 0), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeFalsy();
	});
	it("should not recognize a point past the base of the cone", () => {
		expect(
			isPointWithinCone(new Vector3(3, 0, 0), {
				apex: new Vector3(0, 0, 0),
				direction: new Vector3(2, 0, 0),
				angle: degToRad(90),
			}),
		).toBeFalsy();
	});
});
