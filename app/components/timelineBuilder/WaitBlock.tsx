import { ValueInput, MadLibSelect, type BlockProps } from "./BlockInputs";

export function WaitBlock({ time, unit, update }: BlockProps<"Wait">) {
	return (
		<div>
			Wait for{" "}
			<ValueInput
				value={time.toString()}
				onChange={(value) => update("time", Number(value))}
			/>{" "}
			<MadLibSelect
				value={unit}
				onChange={(value) => update("unit", value as any)}
				options={["milliseconds", "seconds", "minutes"]}
			/>
		</div>
	);
}
