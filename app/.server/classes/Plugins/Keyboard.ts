import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import z from "zod";

import type BasePlugin from ".";
import { Aspect } from "./Aspect";

export class KeyboardPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		description: z.string(),
		category: z.string(),
		keys: z
			.object({
				id: z.string(),
				keyCode: z.string(),
				meta: z.enum(["shift", "alt", "meta", "control", "capsLock"]).array(),
				downBlocks: timelineBlock.array(),
				upBlocks: timelineBlock.array(),
			})
			.array()
			.default([]),
	});
	apiVersion = "keyboard/v1" as const;
	kind = "keyboards" as const;
	name: string;
	description: string;
	category: string;

	keys: {
		id: string;
		keyCode: string;
		meta: ("shift" | "alt" | "meta" | "control" | "capsLock")[];
		downBlocks: TimelineBlock[];
		upBlocks: TimelineBlock[];
	}[];

	assets = {};
	constructor(params: Partial<KeyboardPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Keyboard",
			plugin.aspects.keyboards.map((keyboard) => keyboard.name),
		);
		super({ name, ...params }, { kind: "keyboards" }, plugin);
		this.name = name;
		this.description = "Performs actions on keypress.";
		this.category = params.category || "";
		this.keys = params.keys || [];
	}
}
