import {
	MadLibSelect,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function MathIntoVariable({
	number1,
	number2,
	operation,
	update,
	variable,
}: BlockProps<"MathIntoVariable">) {
	return (
		<div className="flex items-center gap-x-1 gap-y-5 flex-wrap">
			Save the result of
			<ValueInput
				value={number1.toString()}
				onChange={(value) => update("number1", value)}
			/>{" "}
			<MadLibSelect
				options={["+", "-", "×", "÷"]}
				value={operation}
				onChange={(value) => update("operation", value as any)}
			/>{" "}
			<ValueInput
				value={number2.toString()}
				onChange={(value) => update("number2", value)}
			/>
			as local variable{" "}
			<ValueInput
				value={variable}
				onChange={(value) => update("variable", value)}
			/>
		</div>
	);
}
