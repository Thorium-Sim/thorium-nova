import { ConvexHull } from "@thorium/utils/starmap/ConvexHull";
import { convexHull } from "crashcat";
import type { Group, Object3DEventMap } from "three";

export function generateColliderDesc(gltf: { scene: Group<Object3DEventMap> }, size: number) {
	try {
		const hull = new ConvexHull();
		if (!gltf) {
			throw new Error("Failed to load gltf");
		}
		// This properly scales the collider to the size of the ship
		const object = gltf.scene.children[0].clone();
		object.scale.multiplyScalar(size);
		hull.setFromObject(object);
		const positions = [];
		for (const vertex of hull.vertices) {
			positions.push(vertex.point.x, vertex.point.y, vertex.point.z);
		}
		const colliderDesc = convexHull.create({ positions });
		return colliderDesc;
	} catch (err) {
		console.error("Failed to generate convex hull");
		console.error(err);
		return null;
	}
}
