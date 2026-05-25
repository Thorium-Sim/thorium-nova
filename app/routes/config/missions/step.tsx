import { Navigate } from "@thorium/components/Navigate";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import { Button } from "react-aria-components";
import { href, Outlet } from "react-router";

import type { Route } from "./+types/step";

export default function TimelineStep({
	params: { pluginId, timelineId, stepId },
}: Route.ComponentProps) {
	const [timeline] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "missions",
	});

	const step = timeline.steps.find((s) => s.id === stepId);

	if (!step)
		return (
			<Navigate to={href("/config/:pluginId/missions/:timelineId", { pluginId, timelineId })} />
		);

	return (
		<div className="flex flex-1 flex-col">
			<div className="flex w-full justify-between gap-2">
				<div className="flex-1">
					<Input
						labelHidden={false}
						label="Step Name"
						placeholder="Retrieve Information"
						key={step.id}
						defaultValue={step.name}
						onBlur={async (e: any) => {
							try {
								await q.plugin.timeline.step.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									stepId,
									name: e.target.value,
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming step",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					/>
					<TagInput
						className="flex-1"
						label="Tags"
						tags={step.tags}
						onAdd={(tag) => {
							if (step.tags.includes(tag)) return;
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								tags: [...step.tags, tag],
							});
						}}
						onRemove={(tag) => {
							if (!step.tags.includes(tag)) return;
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								tags: step.tags.filter((t) => t !== tag),
							});
						}}
					/>
				</div>
				<div className="flex-1">
					<Input
						as="textarea"
						className="!h-24"
						labelHidden={false}
						label="Description"
						key={step.id}
						defaultValue={step.description}
						onBlur={(e: any) =>
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								description: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<h3 className="text-xl font-semibold">
				Blocks{" "}
				<InfoTip>
					Compose blocks together to create the logic for your timeline step. Get entity references,
					store properties in variables, and execute actions.
				</InfoTip>
			</h3>
			<div className="flex-1 overflow-x-hidden overflow-y-auto">
				{!step?.blocks || step?.blocks?.length === 0 ? (
					<div>
						<p>No blocks added to step.</p>
						<AddBlockButton
							executionType={["main"]}
							onAddBlock={async (type, init) => {
								await q.plugin.timeline.step.block.add.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									stepId,
									blockType: type,
									init,
								});
							}}
						>
							<Button className="btn btn-sm btn-outline btn-success">Add Block</Button>
						</AddBlockButton>
					</div>
				) : (
					<SortableBlocks
						executionType={["main"]}
						blocks={step?.blocks || []}
						onDragEnd={({ active, overIndex }) =>
							q.plugin.timeline.step.block.reorder.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								blockId: active.id as string,
								newIndex: Number(overIndex),
							})
						}
						onUpdate={(block, property, value) => {
							const { id: _, type: __, ...properties } = block;
							q.plugin.timeline.step.block.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								blockId: block.id,
								properties: { ...properties, [property]: value },
							});
						}}
						onReplace={(id, blocks) => {
							q.plugin.timeline.step.block.replace.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								blockId: id,
								blocks,
							});
						}}
						onRemove={(id) =>
							q.plugin.timeline.step.block.delete.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								stepId,
								blockId: id,
							})
						}
					/>
				)}
			</div>
			<AddBlockButton
				executionType={["main"]}
				onAddBlock={async (type, init) => {
					await q.plugin.timeline.step.block.add.netSend({
						pluginId,
						timelineId,
						timelineType: "missions",
						stepId,
						blockType: type,
						init,
					});
				}}
			>
				<Button className="btn btn-sm btn-outline btn-success">Add Block</Button>
			</AddBlockButton>

			<Outlet />
		</div>
	);
}
