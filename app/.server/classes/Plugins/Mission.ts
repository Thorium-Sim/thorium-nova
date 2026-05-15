import type { TimelineStep } from "@thorium/.server/classes/Plugins/TimelineStep";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import uniqid from "@thorium/utils/uniqid";

import { Aspect } from "./Aspect";
import type BasePlugin from "./index";
export default class MissionPlugin extends Aspect {
	apiVersion = "timeline/v1" as const;
	kind = "missions" as const;
	name: string;
	description: string;
	category: string;
	tags: string[];
	flightMode: "nova" | "legacy";

	/** Blocks that are executed when checking to see if a timeline is valid. */
	prerequisiteBlocks: TimelineBlock[];

	steps: TimelineStep[];
	/**
	 * Asset paths are relative to the Thorium data directory.
	 */
	assets: {
		/**
		 * For missions. The image that will be used when showing off this mission.
		 */
		cover: string;
	};

	constructor(params: Partial<MissionPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Mission",
			plugin.aspects.missions.map((timeline) => timeline.name),
		);
		super({ name, ...params }, { kind: "missions" }, plugin, {});
		this.name = name;
		this.description = params.description || "What could possibly go wrong?";

		this.category = params.category || "";
		this.tags = params.tags || [];
		this.flightMode = params.flightMode || "nova";

		this.assets = params.assets || {
			cover: "",
		};

		this.steps = params.steps || [
			{
				id: uniqid("ms-"),
				name: "Timeline Initialization",
				description:
					"Initialize anything that needs to be present at the beginning of this timeline.",
				tags: [],
				blocks: [],
			},
		];

		this.prerequisiteBlocks = params.prerequisiteBlocks || [];
	}
	addStep(name: string, blocks?: TimelineBlock[]) {
		const id = uniqid("ms-");
		this.steps.push({
			id,
			name,
			description: "",
			tags: [],
			blocks: blocks || [],
		});
		return id;
	}
	removeStep(id: string) {
		this.steps = this.steps.filter((step) => step.id !== id);
	}
	insertStep(name: string, selectedStepId: string) {
		const id = uniqid("ms-");
		const index = this.steps.findIndex((s) => s.id === selectedStepId);
		this.steps.splice(index, 0, {
			id,
			name,
			tags: [],
			description: "",
			blocks: [],
		});
		return id;
	}
	duplicateStep(id: string) {
		const index = this.steps.findIndex((s) => s.id === id);
		const step = this.steps[index];
		if (!step) return;
		const newStep = { ...step, id: uniqid("ms-") };
		this.steps.splice(index, 0, newStep);
		return newStep.id;
	}
}
