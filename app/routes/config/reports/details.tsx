import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Navigate } from "@thorium/components/Navigate";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { Button } from "react-aria-components";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { reportVariableNames } from "@thorium/routes/config/reports/reportAvailableVariables";

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
			className="flex-1 overflow-y-auto px-1 grid grid-cols-2 grid-rows-[auto_1fr] gap-4"
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
								navigate(`/config/${pluginId}/timelines/${result.timelineId}`);
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
						className="!h-32"
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
			<div className="col-span-2 flex flex-col">
				<h3 className="text-lg font-medium flex items-center">
					Prerequisites{" "}
					<InfoTip>
						These blocks will be executed immediately, including any checks, to
						evaluate if the timeline is available to be used. Leave blank to
						always include this timeline.
					</InfoTip>
				</h3>
				<div className="flex-1 overflow-y-auto overflow-x-hidden">
					{prerequisiteBlocks.length === 0 ? (
						<div>
							<p>No prerequisite blocks.</p>
							<AddBlockButton
								executionType={["prerequisite"]}
								onAddBlock={async (type, init) => {
									await q.plugin.timeline.prerequisiteBlock.add.netSend({
										pluginId,
										timelineId,
										timelineType: "reports",
										blockType: type,
										init,
									});
								}}
							>
								<Button className="btn btn-sm btn-outline btn-success">
									Add Block
								</Button>
							</AddBlockButton>
						</div>
					) : (
						<SortableBlocks
							executionType={["prerequisite"]}
							blocks={prerequisiteBlocks}
							availableVariableNames={reportVariableNames}
							onDragEnd={({ active, overIndex }) =>
								q.plugin.timeline.prerequisiteBlock.reorder.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									blockId: active.id as string,
									newIndex: Number(overIndex),
								})
							}
							onUpdate={(block, property, value) => {
								const { id, type, ...properties } = block;
								q.plugin.timeline.prerequisiteBlock.update.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									blockId: block.id,
									properties: { ...properties, [property]: value },
								});
							}}
							onReplace={(id, blocks) => {
								q.plugin.timeline.prerequisiteBlock.replace.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									blockId: id,
									blocks,
								});
							}}
							onRemove={(id) =>
								q.plugin.timeline.prerequisiteBlock.delete.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									blockId: id,
								})
							}
						/>
					)}
				</div>
				<AddBlockButton
					executionType={["prerequisite"]}
					onAddBlock={async (type, init) => {
						await q.plugin.timeline.prerequisiteBlock.add.netSend({
							pluginId,
							timelineId,
							timelineType: "reports",
							blockType: type,
							init,
						});
					}}
				>
					<Button className="btn btn-sm btn-outline btn-success">
						Add Block
					</Button>
				</AddBlockButton>
			</div>
		</fieldset>
	);
}
