import { isSortable } from "@dnd-kit/react/sortable";
import { StepButtons, TimelineStepEditor } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import Select from "@thorium/ui/Select";
import { SortableList } from "@thorium/ui/SortableItem";
import { useState } from "react";

export function TimelineEditorCore() {
	const [flight] = q.flight.active.useNetRequest();

	const [timelines] = q.plugin.timeline.all.useNetRequest({});
	const [selectedId, setSelectedId] = useState<string | null>("Thorium Default-Sensors");
	const selectedTimeline = timelines.find(
		(t) => selectedId?.startsWith(t.pluginName) && selectedId?.endsWith(t.name),
	);

	const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
	const selectedStep = selectedTimeline?.steps.find((s) => s.id === selectedStepId);
	const [activeTimelines] = q.flight.timelines.useNetRequest();
	console.log(activeTimelines);
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-1">
				<Button className="btn-xs btn-error" onClick={() => q.flight.reset.netSend()}>
					Restart
				</Button>
				<Button className="btn-xs btn-warning" onClick={() => q.flight.snapshot.netSend({})}>
					Snapshot
				</Button>
				<Select
					items={flight?.snapshots.map((s) => ({ id: s, label: s })) || []}
					label="Restore Snapshot"
					labelHidden
					placeholder="Restore"
					selected={null}
					setSelected={(value) => q.flight.restoreSnapshot.netSend({ name: value || undefined })}
					size="xs"
					disabled={!flight?.snapshots || flight.snapshots.length === 0}
				/>
			</div>
			<Select
				items={[
					{
						header: "Missions",
						items: timelines
							.filter((t) => t.kind === "missions")
							.map((t) => ({
								id: `${t.pluginName}-${t.name}`,
								label: `${activeTimelines.some((a) => a.type === "mission" && a.name === t.name) ? "🟢 " : ""}${t.name}`,
							})),
					},
					{
						header: "Trainings",
						items: timelines
							.filter((t) => t.kind === "trainings")
							.map((t) => ({
								id: `${t.pluginName}-${t.name}`,
								label: `${activeTimelines.some((a) => a.type === "training" && a.name === t.name) ? "🟢 " : ""}${t.name}`,
							})),
					},
					{
						header: "Reports",
						items: timelines
							.filter((t) => t.kind === "reports")
							.map((t) => ({
								id: `${t.pluginName}-${t.name}`,
								label: `${activeTimelines.some((a) => a.type === "report" && a.name === t.name) ? "🟢 " : ""}${t.name}`,
							})),
					},
				]}
				label="Mission"
				labelHidden
				selected={selectedId}
				setSelected={(value) => setSelectedId(value)}
				size="xs"
				className="w-full"
			/>
			<SortableList
				items={
					selectedTimeline?.steps.map((s) => ({
						id: s.id,
						children: (sortable) => (
							<div>
								<div ref={sortable.handleRef}>{s.name}</div>
								{selectedStep && selectedStepId === s.id ? (
									<div className="black/50">
										<TimelineStepEditor
											pluginId={selectedTimeline.pluginName}
											timelineId={selectedTimeline.name}
											timelineType={selectedTimeline.kind}
											step={s}
										/>
									</div>
								) : null}
							</div>
						),
						className: "list-group-item-xs",
					})) || []
				}
				onDragEnd={async (event) => {
					if (!selectedTimeline) return;
					if (event.canceled || !event.operation.source || !isSortable(event.operation.source))
						return;
					const result = await q.plugin.timeline.step.reorder.netSend({
						pluginId: selectedTimeline.pluginName,
						timelineId: selectedTimeline.name,
						timelineType: selectedTimeline.kind,
						stepId: event.operation.source.id as string,
						newIndex: event.operation.source.index,
					});
					if (result) {
						setSelectedStepId(result.stepId);
					}
				}}
				selectedItem={selectedStepId}
				onClick={(id) => setSelectedStepId(id)}
			/>

			{selectedTimeline && (
				<StepButtons
					pluginId={selectedTimeline.pluginName}
					timelineId={selectedTimeline.name}
					timelineType={selectedTimeline.kind}
					stepId={selectedStepId}
					setStep={(stepId) => {
						setSelectedStepId(stepId);
					}}
				/>
			)}
		</div>
	);
}
