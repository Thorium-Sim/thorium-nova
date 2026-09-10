import { ValueInput, type BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";

export function SetLocalVariable({ value, variable, update }: BlockProps<"SetLocalVariable">) {
	return (
		<div className="flex items-center gap-1">
			Set local variable{" "}
			<ValueInput value={variable} onChange={(value) => update("variable", value)} /> to{" "}
			<ValueInput value={value} onChange={(value) => update("value", value)} />
		</div>
	);
}
