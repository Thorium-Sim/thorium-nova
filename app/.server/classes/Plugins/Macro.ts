import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type BasePlugin from ".";
import { Aspect } from "./Aspect";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";

export class MacroPlugin extends Aspect {
	apiVersion = "ships/v1" as const;
	kind = "macros" as const;
	name: string;
	description: string;
	category: string;

	blocks: TimelineBlock[];

	assets = {};
	constructor(params: Partial<MacroPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Macro",
			plugin.aspects.macros.map((macro) => macro.name),
		);
		super({ name, ...params }, { kind: "macros" }, plugin, {});
		this.name = name;
		this.description =
			params.description || "Performs several actions at once.";
		this.category = params.category || "";

		this.blocks = params.blocks || [];
	}
}
