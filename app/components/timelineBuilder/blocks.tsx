/**
 * Actions can return values. Like creating a timeline returns a value.
 * This should allow us to set variables on timelines when they are created
 * like the ship which is going to pursue that timeline. That variable
 * can then be used throughout the entire timeline.
 */

import {
	timelineBlockDefaults,
	type TimelineBlock,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { ActionBlock } from "@thorium/components/timelineBuilder/ActionBlock";
import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import { BlockWrapper } from "@thorium/components/timelineBuilder/BlockWrapper";
import { DistanceCondition } from "@thorium/components/timelineBuilder/DistanceCondition";
import { EntityCondition } from "@thorium/components/timelineBuilder/EntityCondition";
import { EntityPropertyIntoVariable } from "@thorium/components/timelineBuilder/EntityPropertyIntoVariable";
import { EventCondition } from "@thorium/components/timelineBuilder/EventCondition";
import { IfCondition } from "@thorium/components/timelineBuilder/IfCondition";
import { ResultPropertyIntoVariable } from "@thorium/components/timelineBuilder/ResultPropertyGetter";
import { ShipSystemGetter } from "@thorium/components/timelineBuilder/ShipSystemGetter";
import { VariableGetter } from "@thorium/components/timelineBuilder/VariableGetter";
import { SetVariable } from "@thorium/components/timelineBuilder/VariableSetter";
import { WaitBlock } from "@thorium/components/timelineBuilder/WaitBlock";
import { Suspense } from "react";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { arrayMove } from "@dnd-kit/sortable";
import { AddBlockMenu } from "@thorium/components/timelineBuilder/AddBlockMenu";
import uniqid from "@thorium/utils/uniqid";
import { RandomIntoVariable } from "@thorium/components/timelineBuilder/RandomBlock";
import { MathIntoVariable } from "@thorium/components/timelineBuilder/MathIntoVariableBlock";
import { MacroBlock } from "@thorium/components/timelineBuilder/MacroBlock";

export function RenderBlock<T extends TimelineBlock["type"]>({
	onRemove,
	update,
	previousActionBlock,
	definedVariables,
	replace,
	...block
}: TimelineBlock & {
	onRemove: (id: string) => void;
	previousActionBlock?: TimelineBlock;
	update: BlockProps<T>["update"];
	definedVariables: string[];
	/** Replace this block with some other blocks */
	replace: (blocks: TimelineBlock[]) => void;
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
				) : block.type === "RandomIntoVariable" ? (
					<RandomIntoVariable {...block} update={update} />
				) : block.type === "MathIntoVariable" ? (
					<MathIntoVariable {...block} update={update} />
				) : block.type === "Macro" ? (
					<MacroBlock
						{...block}
						update={update}
						replace={replace}
						definedVariables={definedVariables}
					/>
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
							onReplace={(id, blocks) => {
								(update as any)(
									"triggerBlocks",
									block.triggerBlocks.flatMap((b) => {
										if (b.id === id) {
											return blocks;
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
