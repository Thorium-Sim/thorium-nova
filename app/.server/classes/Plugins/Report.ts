import type BasePlugin from "./index";
import { Aspect } from "./Aspect";
import uniqid from "@thorium/utils/uniqid";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import type { TimelineStep } from "@thorium/.server/classes/Plugins/TimelineStep";

export default class ReportPlugin extends Aspect {
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

	steps: TimelineStep[];

	constructor(params: Partial<ReportPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Report",
			plugin.aspects.reports.map((timeline) => timeline.name),
		);
		super({ name, ...params }, { kind: "reports" }, plugin, {});
		this.name = name;
		this.description =
			params.description || "A report for repairing damaged systems.";

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
	}
	addStep(name: string) {
		const id = uniqid("ms-");
		this.steps.push({
			id,
			name,
			description: "",
			tags: [],
			blocks: [],
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
