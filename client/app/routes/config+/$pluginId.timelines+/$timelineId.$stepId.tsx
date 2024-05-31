import { ActionCombobox } from "@client/components/Config/ActionBuilder";
import { q } from "@client/context/AppContext";
import { toast } from "@client/context/ToastContext";
import type { DragEndEvent } from "@dnd-kit/core";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Input from "@thorium/ui/Input";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { SortableList } from "@thorium/ui/SortableItem";
import TagInput from "@thorium/ui/TagInput";
import { Tooltip } from "@thorium/ui/Tooltip";
import { Suspense } from "react";
import { Outlet, useMatch, useNavigate, useParams } from "@remix-run/react";
import { Icon } from "@thorium/ui/Icon";
import { Navigate } from "@client/components/Navigate";

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
	const confirm = useConfirm();
	const step = timeline.steps.find((s) => s.id === stepId);
	const actionId = useMatch(
		"config/:pluginId/timelines/:timelineId/:stepId/:actionId",
	)?.params.actionId;

	if (!step)
		return <Navigate to={`/config/${pluginId}/timelines/${timelineId}`} />;

	const actions = step.actions.map((a) => ({
		id: a.id,
		children: (
			<span className="flex">
				<span className="flex-1">
					{a.name} <span className="text-gray-400"> - {a.action}</span>
				</span>
				<Tooltip content="Delete Action">
					<button
						className=""
						aria-label="Delete action"
						onClick={async (e) => {
							e.stopPropagation();
							e.preventDefault();
							if (
								await confirm(
									"Are you sure you want to delete this action?",
									"This action will be gone forever.",
								)
							) {
								const result =
									await q.plugin.timeline.step.action.delete.netSend({
										pluginId,
										timelineId,
										stepId,
										actionId: a.id,
									});
							}
						}}
					>
						<Icon name="ban" className="text-red-500" />
					</button>
				</Tooltip>
			</span>
		),
	}));
	async function handleDragEnd({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
	}) {
		const result = await q.plugin.timeline.step.action.reorder.netSend({
			pluginId,
			timelineId,
			stepId,
			actionId: active.id as string,
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
			<h3 className="text-xl font-semibold">Actions</h3>
			<SortableList
				items={actions}
				onDragEnd={handleDragEnd}
				selectedItem={actionId}
				className="mb-2"
			/>
			<Suspense fallback={<LoadingSpinner />}>
				<ActionCombobox
					value={null}
					onChange={async ({ action, name }) => {
						const result = await q.plugin.timeline.step.action.add.netSend({
							pluginId,
							timelineId,
							stepId,
							action,
							name,
						});
					}}
					placeholder="Add Action"
				/>
			</Suspense>
			<Outlet />
		</div>
	);
}
