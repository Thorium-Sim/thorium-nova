import { DRACOLoader } from "./DRACOLoader";
import { type GLTF, GLTFLoader } from "./GLTFLoader";

const gltfCache = new Map<string, GLTF>();

export async function loadGltf(url: string) {
	if (gltfCache.has(url)) {
		return gltfCache.get(url);
	}
	const loader = new GLTFLoader();
	loader.setDRACOLoader(new DRACOLoader());
	return new Promise<GLTF>((resolve, reject) => {
		loader.load(
			url,
			(gltf: GLTF) => {
				gltfCache.set(url, gltf);
				resolve(gltf);
			},
			() => {},
			(error) => {
				console.error("error", error);
				reject(error);
			},
		);
	});
}
