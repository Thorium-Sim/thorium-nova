import { MadLibSelect, type BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";

export function TimelineAvailabilityBlock({
	isAvailable,
	update,
}: BlockProps<"TimelineAvailability">) {
	return (
		<div className="flex flex-wrap items-center gap-x-1 gap-y-5">
			This timeline should be
			<MadLibSelect
				options={["available", "unavailable"]}
				value={isAvailable ? "available" : "unavailable"}
				onChange={(value) => update("isAvailable", value === "available")}
			/>
			.
		</div>
	);
}
