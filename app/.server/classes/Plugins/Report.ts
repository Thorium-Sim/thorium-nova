import type { TimelineStep } from "@thorium/.server/classes/Plugins/TimelineStep";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { Aspect } from "./Aspect";
import type BasePlugin from "./index";

export default class ReportPlugin extends Aspect {
	static schema = z.object({
		name: z.string(),
		description: z.string(),
		category: z.string(),
		tags: z.string().array(),
		flightMode: z.enum(["nova", "legacy"]),
		prerequisiteBlock: timelineBlock.array().optional(),
		steps: z
			.object({
				id: z.string(),
				name: z.string(),
				description: z.string(),
				tags: z.string().array(),
				blocks: timelineBlock.array(),
			})
			.array(),
		assets: z.object({}),
		autoApplyWhenCompleted: z.boolean(),
	});
	apiVersion = "timeline/v1" as const;
	kind = "reports" as const;
	name: string;
	description: string;
	category: string;
	tags: string[];
	flightMode: "nova" | "legacy";

	assets = {};
	/** Blocks that are executed when checking to see if a timeline is valid. */
	prerequisiteBlocks: TimelineBlock[];

	/** Apply the report effects automatically when timeline advances past the final step. */
	autoApplyWhenCompleted: boolean;
	steps: TimelineStep[];

	constructor(params: Partial<ReportPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Report",
			plugin.aspects.reports.map((timeline) => timeline.name),
		);
		super({ name, ...params }, { kind: "reports" }, plugin);
		this.name = name;
		this.description = params.description || "A report for repairing damaged systems.";

		this.category = params.category || "";
		this.tags = params.tags || [];
		this.flightMode = params.flightMode || "nova";

		this.steps = params.steps || [
			{
				id: uniqid("dr-"),
				name: "Step 1",
				description: "",
				tags: [],
				blocks: [],
			},
		];

		this.prerequisiteBlocks = params.prerequisiteBlocks || [];
		this.autoApplyWhenCompleted = params.autoApplyWhenCompleted ?? true;
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
		const index = this.steps.findIndex((s) => s.id === selectedStepId) + 1;
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
