import { ActionCombobox } from "@thorium/components/Config/ActionBuilder";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import type { DragEndEvent } from "@dnd-kit/core";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Input from "@thorium/ui/Input";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import TagInput from "@thorium/ui/TagInput";
import { Suspense } from "react";
import { Outlet, useMatch, useNavigate, useParams } from "react-router";
import { Navigate } from "@thorium/components/Navigate";
import {
	AddBlockButton,
	AddBlockMenu,
} from "@thorium/routes/config/timelines/builder/AddBlockMenu";
import { Button } from "react-aria-components";
import { RenderBlock } from "@thorium/routes/config/timelines/builder/blocks";
import InfoTip from "@thorium/ui/InfoTip";
import type { TimelineBlock } from "@thorium/.server/classes/Plugins/TimelineBlockTypes";

export default function TimelineStep() {
	const { pluginId, timelineId, stepId } = useParams() as {
		pluginId: string;
		timelineId: string;
		stepId: string;
	};
	const [timeline] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
	});

	const navigate = useNavigate();
	const step = timeline.steps.find((s) => s.id === stepId);

	if (!step)
		return <Navigate to={`/config/${pluginId}/timelines/${timelineId}`} />;

	async function handleDragEnd({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
	}) {
		const result = await q.plugin.timeline.step.block.reorder.netSend({
			pluginId,
			timelineId,
			stepId,
			blockId: active.id as string,
			newIndex: Number(overIndex),
		});
		if (result) {
			navigate(result.actionId);
		}
	}

	return (
		<div className="flex-1 flex flex-col">
			<div className="flex justify-between w-full gap-2">
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
								stepId,
								tags: [...step.tags, tag],
							});
						}}
						onRemove={(tag) => {
							if (!step.tags.includes(tag)) return;
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
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
					Compose blocks together to create the logic for your timeline step.
					Get entity references, store properties in variables, and execute
					actions.
				</InfoTip>
			</h3>
			<div className="flex flex-col gap-2 py-2 pr-2 overflow-y-auto">
				{step.blocks?.map((block, index) => (
					<RenderBlock
						key={block.id}
						update={(property, value) => {
							const { id, type, ...properties } = block;
							q.plugin.timeline.step.block.update.netSend({
								pluginId,
								timelineId,
								stepId,
								blockId: block.id,
								properties: { ...properties, [property]: value },
							});
						}}
						{...block}
						onRemove={async (id) => {
							await q.plugin.timeline.step.block.delete.netSend({
								pluginId,
								timelineId,
								stepId,
								blockId: id,
							});
						}}
						previousActionBlock={step.blocks.reduceRight(
							(prev: TimelineBlock | undefined, next, i) => {
								if (prev) return prev;
								if (i < index && next.type === "Action") return next;
								return prev;
							},
							undefined,
						)}
					/>
				))}
			</div>
			<div className="flex-1" />
			<AddBlockButton
				onAddBlock={async (type) => {
					await q.plugin.timeline.step.block.add.netSend({
						pluginId,
						timelineId,
						stepId,
						blockType: type,
					});
				}}
			>
				<Button className="btn btn-sm btn-outline btn-success">
					Add Block
				</Button>
			</AddBlockButton>

			<Outlet />
		</div>
	);
}
