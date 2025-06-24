/**
 * Actions can return values. Like creating a timeline returns a value.
 * This should allow us to set variables on timelines when they are created
 * like the ship which is going to pursue that timeline. That variable
 * can then be used throughout the entire timeline.
 */

import {
	timelineBlockDefaults,
	type TimelineBlock,
} from "@thorium/routes/config/timelines/builder/TimelineBlockTypes";
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
import { SortableBlocks } from "@thorium/routes/config/timelines/builder/SortableBlocks";
import { arrayMove } from "@dnd-kit/sortable";
import { AddBlockMenu } from "@thorium/routes/config/timelines/builder/AddBlockMenu";
import uniqid from "@thorium/utils/uniqid";

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
						previousActionOrEventBlock={previousActionBlock}
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
			{"triggerBlocks" in block ? (
				<div className="relative mb-8">
					<div className="h-[calc(100%-1rem)] w-4 left-2  border-white/50 border-l border-b absolute rounded-bl-full" />
					<div className="pl-8">
						<SortableBlocks
							parentBlock={block}
							blocks={block.triggerBlocks}
							onRemove={(id) =>
								(update as any)(
									"triggerBlocks",
									block.triggerBlocks.filter((t) => t.id !== id),
								)
							}
							onDragEnd={({ activeIndex, overIndex }) => {
								(update as any)(
									"triggerBlocks",
									arrayMove(block.triggerBlocks, activeIndex, overIndex),
								);
							}}
							onUpdate={(innerBlock, property, value) => {
								const { id, type, ...properties } = innerBlock;
								(update as any)(
									"triggerBlocks",
									block.triggerBlocks.map((b) => {
										if (b.id === id) {
											return { ...b, ...properties, [property]: value };
										}
										return b;
									}),
								);
							}}
						/>
					</div>
					<AddBlockMenu
						onAddBlock={(type, init) =>
							(update as any)("triggerBlocks", [
								...block.triggerBlocks,
								{
									id: uniqid("blo-"),
									type,
									...(timelineBlockDefaults[type] as any),
									...init,
								},
							])
						}
					/>
				</div>
			) : null}
		</Suspense>
	);
}
