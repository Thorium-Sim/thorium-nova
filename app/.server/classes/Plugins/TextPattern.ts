import type BasePlugin from "@thorium/.server/classes/Plugins";
import { Aspect } from "@thorium/.server/classes/Plugins/Aspect";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { z } from "zod";

export default class TextPatternPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		description: z.string(),
		textPattern: z.string(),
		category: z.string(),
	});
	apiVersion = "textPatterns/v1" as const;
	kind = "textPatterns" as const;
	name: string;
	description: string;
	textPattern: string;
	category: string;
	assets = {};
	constructor(params: Partial<TextPatternPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Text Pattern",
			plugin.aspects.textPatterns.map((textPattern) => textPattern.name),
		);
		super({ name, ...params }, { kind: "textPatterns" }, plugin);
		this.name = name;
		this.description = params.description || "";
		this.textPattern = params.textPattern || "";
		this.category = params.category || "";
	}
}
