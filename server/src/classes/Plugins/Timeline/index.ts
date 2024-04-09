import type BasePlugin from "../index";
import { Aspect } from "../Aspect";
import { generateIncrementedName } from "server/src/utils/generateIncrementedName";
import type { components } from "@server/components";
import uniqid from "@thorium/uniqid";

export type EntityQuery = ComponentQuery[];

export type ValueQuery = {
	query: EntityQuery;
	select: Pick<ComponentQuery, "component" | "property"> & {
		matchType?: "all" | "first" | "random";
	};
};
export type ComponentQuery = {
	component: keyof typeof components | "";
	property: string | "";
	comparison: string | null;
	value: string | ValueQuery;
};

interface TimelineAction {
	id: string;
	name: string;
	action: string;
	values: Record<string, (any & {}) | ValueQuery>;
}

interface TimelineStep {
	id: string;
	name: string;
	description: string;
	tags: string[];
	actions: TimelineAction[];
}

export default class TimelinePlugin extends Aspect {
	apiVersion = "ships/v1" as const;
	kind = "timelines" as const;
	name: string;
	description: string;
	category: string;
	tags: string[];
	isMission: boolean;

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

	constructor(params: Partial<TimelinePlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Timeline",
			plugin.aspects.timelines.map((timeline) => timeline.name),
		);
		super({ name, ...params }, { kind: "timelines" }, plugin);
		this.name = name;
		this.description = params.description || "What could possibly go wrong?";

		this.category = params.category || "";
		this.tags = params.tags || [];
		this.isMission = params.isMission || false;

		this.assets = params.assets || {
			cover: "",
		};

		// TODO: Add a default step
		this.steps = params.steps || [
			{
				id: uniqid("ms-"),
				name: "Timeline Initialization",
				description:
					"Initialize anything that needs to be present at the beginning of this timeline.",
				tags: [],
				actions: [this.defaultAction],
			},
		];
	}
	addStep(name: string) {
		const id = uniqid("ms-");
		this.steps.push({
			id,
			name,
			description: "",
			tags: [],
			actions: [this.defaultAction],
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
			actions: [this.defaultAction],
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
	get defaultAction() {
		return {
			id: uniqid("act-"),
			name: "Trigger: Advance Timeline",
			action: "triggers.create",
			values: {
				name: "Advance Timeline",
				active: true,
				conditions: [],
				actions: [
					{
						id: uniqid("act-"),
						name: "Timeline: Advance",
						action: "timeline.advance",
						values: {},
					},
				],
			},
		};
	}
}
