import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Navigate } from "@thorium/components/Navigate";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { Button } from "react-aria-components";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { trainingVariableNames } from "@thorium/routes/config/trainings/trainingAvailableVariables";

export default function TrainingDetails() {
	const { pluginId, timelineId } = useParams() as {
		pluginId: string;
		timelineId: string;
	};
	const [training] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "trainings",
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!training) return <Navigate to={`/config/${pluginId}/trainings`} />;

	const { prerequisiteBlocks } = training;
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
						label="Training Name"
						placeholder="Damage Repair"
						defaultValue={training.name}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							if (!e.target.value) return setError(true);
							try {
								const result = await q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "trainings",
									name: e.target.value,
								});
								navigate(`/config/${pluginId}/timelines/${result.timelineId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming training",
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
						defaultValue={training.description}
						onBlur={(e: any) =>
							q.plugin.timeline.update.netSend({
								pluginId,
								timelineId,
								timelineType: "trainings",
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
					defaultValue={training.category}
					onBlur={(e: any) =>
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "trainings",
							category: e.target.value,
						})
					}
				/>

				<TagInput
					label="Tags"
					tags={training.tags}
					onAdd={(tag) => {
						if (training.tags.includes(tag)) return;
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "trainings",
							tags: [...training.tags, tag],
						});
					}}
					onRemove={(tag) => {
						if (!training.tags.includes(tag)) return;
						q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "trainings",
							tags: training.tags.filter((t) => t !== tag),
						});
					}}
				/>
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
										timelineType: "trainings",
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
							availableVariableNames={trainingVariableNames}
							onDragEnd={({ active, overIndex }) =>
								q.plugin.timeline.prerequisiteBlock.reorder.netSend({
									pluginId,
									timelineId,
									timelineType: "trainings",
									blockId: active.id as string,
									newIndex: Number(overIndex),
								})
							}
							onUpdate={(block, property, value) => {
								const { id, type, ...properties } = block;
								q.plugin.timeline.prerequisiteBlock.update.netSend({
									pluginId,
									timelineId,
									timelineType: "trainings",
									blockId: block.id,
									properties: { ...properties, [property]: value },
								});
							}}
							onReplace={(id, blocks) => {
								q.plugin.timeline.prerequisiteBlock.replace.netSend({
									pluginId,
									timelineId,
									timelineType: "trainings",
									blockId: id,
									blocks,
								});
							}}
							onRemove={(id) =>
								q.plugin.timeline.prerequisiteBlock.delete.netSend({
									pluginId,
									timelineId,
									timelineType: "trainings",
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
							timelineType: "trainings",
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
