import { YAML } from "bun";

export function loadYml(fileData: string | undefined, initialData?: any) {
	return fileData ? YAML.parse(fileData) : initialData;
}
