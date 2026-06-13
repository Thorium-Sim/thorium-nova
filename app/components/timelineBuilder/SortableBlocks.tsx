import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { RenderBlock } from "@thorium/components/timelineBuilder/blocks";
import { DefinedVariableProvider } from "@thorium/components/timelineBuilder/DefinedVariableContext";
import { SortableHandleContext } from "@thorium/components/timelineBuilder/SortableHandleContext";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { cn } from "@thorium/utils/cn";
import { Suspense, type ComponentProps, type ReactNode } from "react";

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
	timelineType,
}: {
	parentBlock?: TimelineBlock;
	blocks: TimelineBlock[];
	onDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"];
	onUpdate: (block: TimelineBlock, property: any, value: any) => void;
	onReplace: (id: string, blocks: TimelineBlock[]) => void;
	onRemove: (id: string) => void;
	executionType: ("main" | "prerequisite")[];
	macro?: boolean;
	availableVariableNames?: string[] | readonly string[];
	timelineType?: "missions" | "reports" | "trainings";
}) {
	return (
		<div className="relative flex flex-1 flex-col gap-2 py-2 pr-2">
			<DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragEnd={onDragEnd}>
				{blocks.map((block, index) => (
					<SortableBlock id={block.id} index={index} key={block.id}>
						<Suspense>
							<DefinedVariableProvider
								variables={blocks.reduce(
									(prev: string[], next, i) => {
										if (i >= index) return prev;
										if ("variable" in next) prev.push(next.variable);
										return prev;
									},
									[...availableVariableNames],
								)}
							>
								<RenderBlock
									{...block}
									timelineType={timelineType}
									executionType={executionType}
									replace={(blocks) => onReplace(block.id, blocks)}
									update={(property, value) => onUpdate(block, property, value)}
									onRemove={onRemove}
									macro={macro}
									previousActionBlock={
										blocks.reduceRight((prev: TimelineBlock | undefined, next, i) => {
											if (prev) return prev;
											if (i < index && next.type === "Action") return next;
											return prev;
										}, undefined) || parentBlock
									}
								/>
							</DefinedVariableProvider>
						</Suspense>
					</SortableBlock>
				))}
			</DragDropProvider>
		</div>
	);
}

function SortableBlock({
	id,
	index,
	children,
}: {
	id: string;
	index: number;
	children: ReactNode;
}) {
	const sortable = useSortable({
		id,
		index,
		modifiers: [RestrictToVerticalAxis],
	});

	return (
		<div ref={sortable.ref} className={cn(sortable.isDragging ? "isolate" : "", "w-fit relative")}>
			<div className={`block ${sortable.isDragging ? "pointer-events-none" : ""}`}>
				<SortableHandleContext value={sortable.handleRef}>{children}</SortableHandleContext>
			</div>
		</div>
	);
}
