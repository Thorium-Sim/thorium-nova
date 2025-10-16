import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import type { components } from "@thorium/ecs-components";

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

export interface TimelineAction {
	id: string;
	name: string;
	action: string;
	values: Record<string, (any & {}) | ValueQuery>;
}
export interface TimelineStep {
	id: string;
	name: string;
	description: string;
	tags: string[];
	blocks: TimelineBlock[];
}
