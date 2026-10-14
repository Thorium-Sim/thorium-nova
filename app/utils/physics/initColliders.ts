import type { GLTF } from "@thorium/utils/.server/loadGltf/GLTFLoader";
import { generateColliderDesc } from "@thorium/utils/physics/generateCollider";
import type { ConvexHullShape } from "crashcat";

const colliderCache = new Map<string, ConvexHullShape>();

export function getCollider(modelPath: string) {
	return colliderCache.get(modelPath);
}

export let collidersInited = false;

export async function initColliders(
	colliders: Map<string, number>,
	loadModel: (modelPath: string) => Promise<GLTF | undefined>,
) {
	for (const [modelPath, length] of colliders) {
		const model = await loadModel(modelPath);
		if (!model) return;
		const colliderDesc = generateColliderDesc(model, length);
		if (!colliderDesc) return;
		colliderCache.set(modelPath, colliderDesc);
	}
	collidersInited = true;
}
