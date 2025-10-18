import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type Over,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn } from "@thorium/utils/cn";
import { RenderBlock } from "@thorium/components/timelineBuilder/blocks";
import type { ReactNode } from "react";
import { SortableListenerContext } from "@thorium/components/timelineBuilder/SortableListenerContext";

export function SortableBlocks({
	parentBlock,
	blocks,
	onDragEnd,
	onUpdate,
	onReplace,
	onRemove,
	executionType,
	macro,
	availableVariableNames = [],
}: {
	parentBlock?: TimelineBlock;
	blocks: TimelineBlock[];
	onDragEnd: ({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
		over: Over | null;
		activeIndex: number;
	}) => void;
	onUpdate: (block: TimelineBlock, property: any, value: any) => void;
	onReplace: (id: string, blocks: TimelineBlock[]) => void;
	onRemove: (id: string) => void;
	executionType: ("main" | "prerequisite")[];
	macro?: boolean;
	availableVariableNames?: string[] | readonly string[];
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const activeIndex = active.data.current?.sortable.index;
		const overIndex = over?.data.current?.sortable.index;

		if (typeof overIndex !== "number") return;
		if (activeIndex !== overIndex) {
			onDragEnd({ active, over, activeIndex, overIndex });
		}
	}

	return (
		<div className="relative flex flex-col flex-1 gap-2 py-2 pr-2">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={blocks.map((item, index) => ({
						...item,
						index,
					}))}
					strategy={verticalListSortingStrategy}
				>
					{blocks.map((block, index) => (
						<SortableBlock id={block.id} key={block.id}>
							<RenderBlock
								{...block}
								executionType={executionType}
								definedVariables={blocks.reduce(
									(prev: string[], next, i) => {
										if (i >= index) return prev;
										if ("variable" in next) prev.push(next.variable);
										return prev;
									},
									[...availableVariableNames],
								)}
								replace={(blocks) => onReplace(block.id, blocks)}
								update={(property, value) => onUpdate(block, property, value)}
								onRemove={onRemove}
								macro={macro}
								previousActionBlock={
									blocks.reduceRight(
										(prev: TimelineBlock | undefined, next, i) => {
											if (prev) return prev;
											if (i < index && next.type === "Action") return next;
											return prev;
										},
										undefined,
									) || parentBlock
								}
							/>
						</SortableBlock>
					))}
				</SortableContext>
			</DndContext>
		</div>
	);
}

function SortableBlock({ id, children }: { id: string; children: ReactNode }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={cn(isDragging ? "isolate" : "", "w-fit relative")}
		>
			<div className={`block  ${isDragging ? "pointer-events-none" : ""}`}>
				<SortableListenerContext value={listeners}>
					{children}
				</SortableListenerContext>
			</div>
		</div>
	);
}
