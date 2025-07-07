import {
	ValueInput,
	EntityInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function SetVariable({
	entity,
	value,
	variable,
	update,
}: BlockProps<"SetVariable">) {
	return (
		<div className="flex items-center gap-1">
			Set variable{" "}
			<ValueInput
				value={variable}
				onChange={(value) => update("variable", value)}
			/>{" "}
			on{" "}
			<EntityInput
				value={entity}
				onChange={(value) => update("entity", value)}
			/>
			to{" "}
			<ValueInput value={value} onChange={(value) => update("value", value)} />
		</div>
	);
}
