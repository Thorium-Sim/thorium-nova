export const timelineBlockTypes = [
	"DistanceCondition",
	"EntityCondition",
	"EventCondition",
	"IfCondition",
	"Wait",
	"WaitComplete",
	"ShipSystemGetter",
	"ResultPropertyIntoVariable",
	"EntityPropertyIntoVariable",
	"VariableIntoVariable",
	"SetVariable",
	"Action",
	"RandomIntoVariable",
	"MathIntoVariable",
	"ForEachEntity",
	"Macro",
	"TimelineAvailability",
	"MacroSlot",
	"Debug",
	"Note",
] as const;

type BlockTypes = (typeof timelineBlockTypes)[number];

export const prerequisiteBlockTypes: BlockTypes[] = [
	"DistanceCondition",
	"EntityCondition",
	"IfCondition",
	"ShipSystemGetter",
	"ResultPropertyIntoVariable",
	"EntityPropertyIntoVariable",
	"VariableIntoVariable",
	"SetVariable",
	"RandomIntoVariable",
	"MathIntoVariable",
	"Macro",
	"TimelineAvailability",
	"Debug",
];
export const mainBlockTypes: BlockTypes[] = [
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
	"RandomIntoVariable",
	"MathIntoVariable",
	"Macro",
	"Debug",
];

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
		checks: [{ component: "", property: "" }],
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
		conditions: [{ comparison: "=", value1: "", value2: "" }],
		triggerBlocks: [],
	},
	Wait: {
		time: 5,
		unit: "seconds",
	},
	WaitComplete: {},
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
	RandomIntoVariable: {
		number1: "0",
		number2: "10",
		numberType: "integer",
		variable: "",
	},
	MathIntoVariable: {
		number1: "0",
		number2: "0",
		operation: "+",
		variable: "",
	},
	ForEachEntity: {
		entity: "",
		variable: "entityId",
		triggerBlocks: [],
	},
	Macro: {
		pluginId: "",
		macroId: "",
		triggerBlocks: [],
	},
	TimelineAvailability: {
		isAvailable: true,
	},
	MacroSlot: {},
	Debug: {
		variable: "",
	},
	Note: {
		note: "",
	},
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
	conditions: {
		value1: string;
		value2: string;
		comparison: string;
	}[];
}

interface WaitBlock extends BaseBlock {
	type: "Wait";
	time: number;
	unit: "milliseconds" | "seconds" | "minutes";
}
interface WaitCompleteBlock extends BaseBlock {
	type: "WaitComplete";
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

interface RandomIntoVariableBlock extends BaseBlock {
	type: "RandomIntoVariable";
	number1: string;
	number2: string;
	numberType: "integer" | "decimal";
	variable: string;
}
interface MathIntoVariableBlock extends BaseBlock {
	type: "MathIntoVariable";
	number1: string;
	number2: string;
	operation: "+" | "-" | "×" | "÷";
	variable: string;
}
interface ForEachEntityBlock extends BaseBlock {
	type: "ForEachEntity";
	entity: string;
	variable: string;
	triggerBlocks: TimelineBlock[];
}

interface MacroBlock extends BaseBlock {
	type: "Macro";
	pluginId: string;
	macroId: string;
	triggerBlocks: TimelineBlock[];
}

interface TimelineAvailabilityBlock extends BaseBlock {
	type: "TimelineAvailability";
	isAvailable: boolean;
}

interface MacroSlot extends BaseBlock {
	type: "MacroSlot";
}
interface DebugBlock extends BaseBlock {
	type: "Debug";
	variable: string;
}

interface NoteBlock extends BaseBlock {
	type: "Note";
	note: string;
}

export type TimelineBlock =
	| DistanceConditionBlock
	| EntityConditionBlock
	| EventConditionBlock
	| IfConditionBlock
	| WaitBlock
	| WaitCompleteBlock
	| ShipSystemsBlock
	| ResultPropertyIntoVariableBlock
	| EntityPropertyIntoVariableBlock
	| VariableIntoVariableBlock
	| SetVariableBlock
	| ActionBlock
	| RandomIntoVariableBlock
	| MathIntoVariableBlock
	| ForEachEntityBlock
	| MacroBlock
	| TimelineAvailabilityBlock
	| MacroSlot
	| DebugBlock
	| NoteBlock;
