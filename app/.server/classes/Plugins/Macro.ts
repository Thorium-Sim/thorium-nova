import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import z from "zod";

import type BasePlugin from ".";
import { Aspect } from "./Aspect";

export class MacroPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		type: z.enum(["macro", "trigger"]),
		description: z.string(),
		category: z.string(),
		active: z.boolean(),
		blocks: timelineBlock.array().default([]),
		assets: z.object({}),
	});
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
		super({ name, ...params }, { kind: "macros" }, plugin);
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
