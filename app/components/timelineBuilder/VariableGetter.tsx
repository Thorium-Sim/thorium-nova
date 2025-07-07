import {
	ValueInput,
	EntityInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function VariableGetter({
	entity,
	getVariable,
	variable,
	update,
}: BlockProps<"VariableIntoVariable">) {
	return (
		<div className="flex items-center gap-1">
			Save variable{" "}
			<ValueInput
				value={getVariable}
				onChange={(value) => update("getVariable", value)}
			/>{" "}
			from{" "}
			<EntityInput
				value={entity}
				onChange={(value) => update("entity", value)}
			/>
			as local variable{" "}
			<ValueInput
				value={variable}
				onChange={(value) => update("variable", value)}
			/>
		</div>
	);
}
