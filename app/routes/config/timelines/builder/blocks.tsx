/**
 * Actions can return values. Like creating a timeline returns a value.
 * This should allow us to set variables on timelines when they are created
 * like the ship which is going to pursue that timeline. That variable
 * can then be used throughout the entire timeline.
 */

import type { TimelineBlock } from "@thorium/.server/classes/Plugins/TimelineBlockTypes";
import { ActionBlock } from "@thorium/routes/config/timelines/builder/ActionBlock";
import type { BlockProps } from "@thorium/routes/config/timelines/builder/BlockInputs";
import { BlockWrapper } from "@thorium/routes/config/timelines/builder/BlockWrapper";
import { DistanceCondition } from "@thorium/routes/config/timelines/builder/DistanceCondition";
import { EntityCondition } from "@thorium/routes/config/timelines/builder/EntityCondition";
import { EntityPropertyIntoVariable } from "@thorium/routes/config/timelines/builder/EntityPropertyIntoVariable";
import { EventCondition } from "@thorium/routes/config/timelines/builder/EventCondition";
import { IfCondition } from "@thorium/routes/config/timelines/builder/IfCondition";
import { ResultPropertyIntoVariable } from "@thorium/routes/config/timelines/builder/ResultPropertyGetter";
import { ShipSystemGetter } from "@thorium/routes/config/timelines/builder/ShipSystemGetter";
import { VariableGetter } from "@thorium/routes/config/timelines/builder/VariableGetter";
import { SetVariable } from "@thorium/routes/config/timelines/builder/VariableSetter";
import { WaitBlock } from "@thorium/routes/config/timelines/builder/WaitBlock";
import { Suspense } from "react";

export function RenderBlock<T extends TimelineBlock["type"]>({
	onRemove,
	update,
	previousActionBlock,
	...block
}: TimelineBlock & {
	onRemove: (id: string) => void;
	previousActionBlock?: TimelineBlock;
	update: BlockProps<T>["update"];
}) {
	return (
		<Suspense>
			<BlockWrapper onRemove={() => onRemove(block.id)}>
				{block.type === "Wait" ? (
					<WaitBlock {...block} update={update} />
				) : block.type === "DistanceCondition" ? (
					<DistanceCondition {...block} update={update} />
				) : block.type === "EntityCondition" ? (
					<EntityCondition {...block} update={update} />
				) : block.type === "EventCondition" ? (
					<EventCondition {...block} update={update} />
				) : block.type === "IfCondition" ? (
					<IfCondition {...block} update={update} />
				) : block.type === "ShipSystemGetter" ? (
					<ShipSystemGetter {...block} update={update} />
				) : block.type === "ResultPropertyIntoVariable" ? (
					<ResultPropertyIntoVariable
						{...block}
						previousActionBlock={previousActionBlock}
						update={update}
					/>
				) : block.type === "EntityPropertyIntoVariable" ? (
					<EntityPropertyIntoVariable {...block} update={update} />
				) : block.type === "VariableIntoVariable" ? (
					<VariableGetter {...block} update={update} />
				) : block.type === "SetVariable" ? (
					<SetVariable {...block} update={update} />
				) : block.type === "Action" ? (
					<ActionBlock {...block} update={update} />
				) : (
					<div>Unknown block type</div>
				)}
			</BlockWrapper>
		</Suspense>
	);
}
