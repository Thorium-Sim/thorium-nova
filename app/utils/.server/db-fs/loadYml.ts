import { load } from "js-yaml";

export function loadYml(fileData: string | undefined, initialData?: any) {
	return fileData
		? load(fileData, {
				json: true,
				onWarning: (e) => console.warn("YAML load warning:", e),
			})
		: initialData;
}
