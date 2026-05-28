import { load } from "js-yaml";

export function loadYml(fileData: string | undefined, initialData?: any) {
	return fileData ? load(fileData) : initialData;
}
