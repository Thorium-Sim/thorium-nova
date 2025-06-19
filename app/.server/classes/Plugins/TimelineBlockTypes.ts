export const timelineBlockTypes = [
	"DistanceCondition",
	"EntityCondition",
	"EventCondition",
	"IfCondition",
	"Wait",
	"ShipSystemGetter",
	"ResultPropertyIntoVariable",
	"EntityPropertyIntoVariable",
	"VariableIntoVariable",
	"SetVariable",
	"Action",
] as const;

type BlockTypes = (typeof timelineBlockTypes)[number];

export const timelineBlockDefaults: {
	[K in BlockTypes]: Omit<Extract<TimelineBlock, { type: K }>, "type" | "id">;
} = {
	DistanceCondition: {
		entity1: "",
		entity2: "",
		comparison: "less than",
		distance: 5000,
		persist: false,
		triggerBlocks: [],
	},
	EntityCondition: {
		checks: [],
		match: "any",
		persist: false,
		triggerBlocks: [],
	},
	EventCondition: {
		event: "",
		multiple: false,
		persist: false,
		triggerBlocks: [],
	},
	IfCondition: {
		comparison: "=",
		value1: "",
		value2: "",
		triggerBlocks: [],
	},
	Wait: {
		time: 5,
		unit: "seconds",
	},
	ShipSystemGetter: {
		count: "all",
		entity: "",
		systemType: "generic",
		variable: "",
	},
	ResultPropertyIntoVariable: { property: "", variable: "" },
	EntityPropertyIntoVariable: {
		entity: "",
		component: "",
		property: "",
		variable: "",
	},
	VariableIntoVariable: {
		entity: "this timeline",
		getVariable: "",
		variable: "",
	},
	SetVariable: { entity: "this timeline", variable: "", value: "" },
	Action: { action: "", values: {} },
};

interface BaseBlock {
	id: string;
	type: (typeof timelineBlockTypes)[number];
}

interface ConditionBlock extends BaseBlock {
	triggerBlocks: TimelineBlock[];
}

interface DistanceConditionBlock extends ConditionBlock {
	type: "DistanceCondition";
	entity1: string;
	entity2: string;
	comparison: "more than" | "less than";
	distance: number;
	persist: boolean;
}

interface EntityConditionCheck {
	component: string;
	property: string;
	comparison?: string;
	value?: string;
}
interface EntityConditionBlock extends ConditionBlock {
	type: "EntityCondition";
	match: "any" | "one" | "no";
	checks: EntityConditionCheck[];
	persist: boolean;
}

interface EventConditionBlock extends ConditionBlock {
	type: "EventCondition";
	event: string;
	multiple: boolean;
	persist: boolean;
}

interface IfConditionBlock extends ConditionBlock {
	type: "IfCondition";
	value1: string;
	value2: string;
	comparison: string;
}

interface WaitBlock extends BaseBlock {
	type: "Wait";
	time: number;
	unit: "milliseconds" | "seconds" | "minutes";
}

interface ShipSystemsBlock extends BaseBlock {
	type: "ShipSystemGetter";
	count: "one" | "all";
	systemType: string;
	entity: string;
	variable: string;
}

interface ResultPropertyIntoVariableBlock extends BaseBlock {
	type: "ResultPropertyIntoVariable";
	variable: string;
	property: string;
}

interface EntityPropertyIntoVariableBlock extends BaseBlock {
	type: "EntityPropertyIntoVariable";
	entity: string;
	component: string;
	property: string;
	variable: string;
}

interface VariableIntoVariableBlock extends BaseBlock {
	type: "VariableIntoVariable";
	getVariable: string;
	entity: string;
	variable: string;
}

interface SetVariableBlock extends BaseBlock {
	type: "SetVariable";
	variable: string;
	entity: string;
	value: string;
}

interface ActionBlock extends BaseBlock {
	type: "Action";
	action: string;
	values: Record<string, any>;
}

export type TimelineBlock =
	| DistanceConditionBlock
	| EntityConditionBlock
	| EventConditionBlock
	| IfConditionBlock
	| WaitBlock
	| ShipSystemsBlock
	| ResultPropertyIntoVariableBlock
	| EntityPropertyIntoVariableBlock
	| VariableIntoVariableBlock
	| SetVariableBlock
	| ActionBlock;
