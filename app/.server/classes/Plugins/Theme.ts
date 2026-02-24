import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { Aspect } from "./Aspect";
import type BasePlugin from "./index";
export default class ThemePlugin extends Aspect {
	apiVersion = "theme/v1" as const;
	kind = "themes" as const;
	name: string;
	default?: boolean;
	assets: {
		rawCSS: string;
		files: string[];
	};

	constructor(params: Partial<ThemePlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Theme",
			plugin.aspects.ships.map((theme) => theme.name),
		);
		super({ name, ...params }, { kind: "themes" }, plugin, {});
		this.name = name;

		this.assets = params.assets || {
			rawCSS: "raw.css",
			files: [],
		};
		this.default = params.default || false;
	}

	async removeAsset(assetPath: string) {
		this.assets.files = this.assets.files.filter((file) => file !== assetPath);
	}
}
