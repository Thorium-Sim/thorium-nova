import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type BasePlugin from ".";
import { Aspect } from "./Aspect";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";

export class MacroPlugin extends Aspect {
	apiVersion = "ships/v1" as const;
	kind = "macros" as const;
	name: string;
	type: "macro" | "trigger";
	description: string;
	category: string;
	/** Used for trigger type macros. */
	active: boolean;

	blocks: TimelineBlock[];

	assets = {};
	constructor(params: Partial<MacroPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Macro",
			plugin.aspects.macros.map((macro) => macro.name),
		);
		super({ name, ...params }, { kind: "macros" }, plugin, {});
		this.name = name;
		this.type = params.type || "macro";
		this.description =
			params.description || this.type === "macro"
				? "Performs several actions at once."
				: "Responds to events.";
		this.category = params.category || "";
		this.active = params.active ?? true;
		this.blocks = params.blocks || [];
	}
}
