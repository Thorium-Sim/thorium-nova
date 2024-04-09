import { DRACOLoader } from "./DRACOLoader";
import { GLTFLoader } from "./GLTFLoader";

export async function loadGltf(url: string) {
	const loader = new GLTFLoader();
	loader.setDRACOLoader(new DRACOLoader());
	return new Promise((resolve, reject) => {
		loader.load(
			url,
			resolve,
			() => {},
			(error) => {
				console.error("error", error);
				reject(error);
			},
		);
	});
}
