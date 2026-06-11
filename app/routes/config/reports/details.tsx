import { Navigate } from "@thorium/components/Navigate";
import { PrerequisiteBlocks } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import { useState } from "react";
import { href, useNavigate, useParams } from "react-router";

export default function ReportDetails() {
	const { pluginId, timelineId } = useParams() as {
		pluginId: string;
		timelineId: string;
	};
	const [report] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "reports",
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!report) return <Navigate to={`/config/${pluginId}/reports`} />;

	const { prerequisiteBlocks } = report;
	return (
		<fieldset
			key={timelineId}
			className="grid flex-1 grid-cols-2 grid-rows-[auto_1fr] gap-4 overflow-y-auto px-1"
		>
			<div>
				<div className="pb-4">
					<Input
						labelHidden={false}
						isInvalid={error}
						invalidMessage="Name is required"
						label="Report Name"
						placeholder="Damage Repair"
						defaultValue={report.name}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							if (!e.target.value) return setError(true);
							try {
								const result = await q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									name: e.target.value,
								});
								navigate(
									href("/config/:pluginId/reports/:timelineId/details", {
										pluginId,
										timelineId: result.timelineId,
									}),
								);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming report",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					/>
				</div>
				<div className="pb-4">
					<Input
						as="textarea"
						className="h-32!"
						labelHidden={false}
						label="Description"
						defaultValue={report.description}
						onBlur={(e: any) =>
							q.plugin.timeline.update.netSend({
								pluginId,
								timelineId,
								timelineType: "reports",
								description: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<div>
				<Input
					labelHidden={false}
					label="Category"
					type="textarea"
					defaultValue={report.category}
					onBlur={(e: any) =>
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "reports",
							category: e.target.value,
						})
					}
				/>

				<TagInput
					label="Tags"
					tags={report.tags}
					onAdd={(tag) => {
						if (report.tags.includes(tag)) return;
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "reports",
							tags: [...report.tags, tag],
						});
					}}
					onRemove={(tag) => {
						if (!report.tags.includes(tag)) return;
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "reports",
							tags: report.tags.filter((t) => t !== tag),
						});
					}}
				/>
				{report.kind === "reports" && (
					<div className="mt-2">
						<Checkbox
							defaultChecked={report.autoApplyWhenCompleted}
							onChange={(event) =>
								q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									autoApplyWhenCompleted: event.target.checked,
								})
							}
							label="Auto-apply Damage Metrics when report is completed."
							helperText="When the timeline advances past its final step, it will improve the damage metrics for the system it is intended to repair."
						/>
					</div>
				)}
			</div>
			<PrerequisiteBlocks
				pluginId={pluginId}
				timelineId={timelineId}
				timelineType="reports"
				prerequisiteBlocks={prerequisiteBlocks}
			/>
		</fieldset>
	);
}
