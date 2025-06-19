import type { TimelineBlock } from "@thorium/.server/classes/Plugins/TimelineBlockTypes";
import { AddBlockMenu } from "@thorium/routes/config/timelines/builder/AddBlockMenu";
import {
	EntityInput,
	MadLibSelect,
	ValueInput,
	type BlockProps,
} from "@thorium/routes/config/timelines/builder/BlockInputs";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";

export function DistanceCondition({
	comparison,
	distance,
	entity1,
	entity2,
	persist,
	triggerBlocks,
	update,
}: BlockProps<"DistanceCondition">) {
	return (
		<>
			<div className="flex gap-1 items-center">
				Wait until{" "}
				<EntityInput
					value={entity1}
					onChange={(value) => update("entity1", value)}
				/>{" "}
				and{" "}
				<EntityInput
					value={entity2}
					onChange={(value) => update("entity2", value)}
				/>{" "}
				are{" "}
				<MadLibSelect
					value={comparison}
					onChange={(value) => update("comparison", value as any)}
					options={["more than", "less than"]}
				/>{" "}
				{/* TODO June 17, 2025: Improve the user experience of inputting this number. */}
				<ValueInput
					value={distance.toString()}
					onChange={(value) => update("distance", Number(value))}
				/>
				km apart.
			</div>
			<div className="flex self-end">
				<Checkbox
					checked={persist}
					onChange={(e) => update("persist", e.currentTarget.checked)}
					label={
						<>
							Persist{" "}
							<InfoTip>
								Whether this trigger condition will continue to exist after the
								timeline step has proceeded. Set this to true if you want the
								trigger remain active. It will still automatically deactivate
								once it has been triggered once.
							</InfoTip>
						</>
					}
				/>
			</div>
			<AddBlockMenu onAddBlock={() => {}} />
		</>
	);
}
