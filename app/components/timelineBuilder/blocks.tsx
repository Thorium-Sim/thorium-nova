/**
 * Actions can return values. Like creating a timeline returns a value.
 * This should allow us to set variables on timelines when they are created
 * like the ship which is going to pursue that timeline. That variable
 * can then be used throughout the entire timeline.
 */

import { move } from "@dnd-kit/helpers";
import { ActionBlock } from "@thorium/components/timelineBuilder/ActionBlock";
import { AddBlockMenu } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { BlockWrapper } from "@thorium/components/timelineBuilder/BlockWrapper";
import { DebugBlock } from "@thorium/components/timelineBuilder/DebugBlock";
import { useDefinedVariables } from "@thorium/components/timelineBuilder/DefinedVariableContext";
import { DistanceCondition } from "@thorium/components/timelineBuilder/DistanceCondition";
import { EntityCondition } from "@thorium/components/timelineBuilder/EntityCondition";
import { EntityPropertyIntoVariable } from "@thorium/components/timelineBuilder/EntityPropertyIntoVariable";
import { EventCondition } from "@thorium/components/timelineBuilder/EventCondition";
import { ForEachEntity } from "@thorium/components/timelineBuilder/ForEachEntity";
import { IfCondition } from "@thorium/components/timelineBuilder/IfCondition";
import { MacroBlock } from "@thorium/components/timelineBuilder/MacroBlock";
import { MacroSlotBlock } from "@thorium/components/timelineBuilder/MacroSlotBlock";
import { MathIntoVariable } from "@thorium/components/timelineBuilder/MathIntoVariableBlock";
import { NoteBlock } from "@thorium/components/timelineBuilder/NoteBlock";
import { RandomIntoVariable } from "@thorium/components/timelineBuilder/RandomBlock";
import { ResultPropertyIntoVariable } from "@thorium/components/timelineBuilder/ResultPropertyGetter";
import { ShipSystemGetter } from "@thorium/components/timelineBuilder/ShipSystemGetter";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { TimelineAvailabilityBlock } from "@thorium/components/timelineBuilder/TimelineAvailabilityBlock";
import {
	timelineBlockDefaults,
	type TimelineBlock,
} from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { VariableGetter } from "@thorium/components/timelineBuilder/VariableGetter";
import { SetVariable } from "@thorium/components/timelineBuilder/VariableSetter";
import { WaitBlock } from "@thorium/components/timelineBuilder/WaitBlock";
import { q } from "@thorium/context/AppContext";
import uniqid from "@thorium/utils/uniqid";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
import { Suspense } from "react";

export function RenderBlock({
	onRemove,
	update,
	previousActionBlock,
	replace,
	executionType,
	macro,
	timelineType,
	...block
}: TimelineBlock & {
	onRemove: (id: string) => void;
	previousActionBlock?: TimelineBlock;
	update: (property: string, value: any) => Promise<void>;
	/** Replace this block with some other blocks */
	replace: (blocks: TimelineBlock[]) => void;
	macro?: boolean;
	executionType: ("main" | "prerequisite")[];
	timelineType?: "missions" | "reports" | "trainings";
}) {
	const [actions] = q.thorium.actions.useNetRequest();
	const localVariables = useDefinedVariables();

	function getActionPresetValues(actionName: string, initValues = {}) {
		const action = actions.find((a) => a.action === actionName);
		const actionSchema = action
			? // oxlint-disable-next-line no-eval
				parseSchema(eval(parseJsonSchema(action.input)), {})
			: [];
		let values = initValues;
		const actionInputs = actionSchema.map((a) => a.key);
		for (const actionInput of actionInputs) {
			if (localVariables.includes(actionInput)) {
				values = { [actionInput]: `$${actionInput}`, ...values };
			}
		}
		return values;
	}
	return (
		<Suspense>
			<BlockWrapper onRemove={() => onRemove(block.id)}>
				{block.type === "Wait" ? (
					<WaitBlock {...block} update={update} />
				) : block.type === "WaitComplete" ? null : block.type === "DistanceCondition" ? (
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
				) : block.type === "ForEachEntity" ? (
					<ForEachEntity {...block} update={update} />
				) : block.type === "Macro" ? (
					<MacroBlock {...block} macro={macro} update={update} replace={replace} />
				) : block.type === "TimelineAvailability" ? (
					<TimelineAvailabilityBlock {...block} update={update} />
				) : block.type === "MacroSlot" ? (
					<MacroSlotBlock />
				) : block.type === "Debug" ? (
					<DebugBlock {...block} update={update} />
				) : block.type === "Note" ? (
					<NoteBlock {...block} update={update} />
				) : (
					(block satisfies never)
				)}
			</BlockWrapper>
			{"triggerBlocks" in block ? (
				<div className="relative mb-8">
					<div className="absolute left-2 h-[calc(100%-1rem)] w-4 rounded-bl-full border-b border-l border-white/50" />
					<div className="pl-8">
						<SortableBlocks
							timelineType={timelineType}
							executionType={executionType}
							parentBlock={block}
							blocks={block.triggerBlocks}
							macro={macro}
							onRemove={(id) =>
								(update as any)(
									"triggerBlocks",
									block.triggerBlocks.filter((t) => t.id !== id),
								)
							}
							onDragEnd={(event) => {
								(update as any)("triggerBlocks", move(block.triggerBlocks, event));
							}}
							onUpdate={async (innerBlock, property, value) => {
								const isActionChange = innerBlock.type === "Action" && property === "action";
								const { id, type: _, ...properties } = innerBlock;
								await (update as any)(
									"triggerBlocks",
									block.triggerBlocks.map((b) => {
										if (b.id === id) {
											return {
												...b,
												...properties,
												[property]: value,
												...(isActionChange ? { values: getActionPresetValues(value) } : {}),
											};
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
						timelineType={timelineType}
						macro={macro}
						executionType={executionType}
						onAddBlock={async (type, init) => {
							if (
								type === "Action" &&
								init &&
								"action" in init &&
								typeof init.action === "string"
							) {
								// @ts-expect-error
								init.values = getActionPresetValues(init.action, init.values);
							}
							(update as any)("triggerBlocks", [
								...block.triggerBlocks,
								{
									id: uniqid("blo-"),
									type,
									...(timelineBlockDefaults[type] as any),
									...init,
								},
							]);
						}}
					/>
				</div>
			) : null}
		</Suspense>
	);
}
