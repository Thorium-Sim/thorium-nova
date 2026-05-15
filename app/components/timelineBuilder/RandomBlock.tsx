import {
	MadLibSelect,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function RandomIntoVariable({
	number1,
	number2,
	numberType,
	update,
	variable,
}: BlockProps<"RandomIntoVariable">) {
	return (
		<div className="flex flex-wrap items-center gap-x-1 gap-y-5">
			Save random{" "}
			<MadLibSelect
				options={["integer", "decimal"]}
				value={numberType}
				onChange={(value) => update("numberType", value as any)}
			/>{" "}
			from <ValueInput value={number1.toString()} onChange={(value) => update("number1", value)} />{" "}
			to <ValueInput value={number2.toString()} onChange={(value) => update("number2", value)} />
			as local variable{" "}
			<ValueInput value={variable} onChange={(value) => update("variable", value)} />
		</div>
	);
}
