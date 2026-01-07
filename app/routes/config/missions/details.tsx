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

export default function MissionDetails() {
	const { pluginId, timelineId } = useParams() as {
		pluginId: string;
		timelineId: string;
	};
	const [mission] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "missions",
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!mission) return <Navigate to={`/config/${pluginId}/timelines`} />;

	const { prerequisiteBlocks } = mission;
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
						label="Mission Name"
						placeholder="Eclipse"
						defaultValue={mission.name}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							if (!e.target.value) return setError(true);
							try {
								const result = await q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									name: e.target.value,
								});
								navigate(`/config/${pluginId}/timelines/${result.timelineId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming timeline",
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
						defaultValue={mission.description}
						onBlur={(e: any) =>
							q.plugin.timeline.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								description: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<div>
				<div className="pb-4 flex gap-2">
					<div className="flex-1">
						<Input
							labelHidden={false}
							label="Category"
							type="textarea"
							defaultValue={mission.category}
							onBlur={(e: any) =>
								q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									category: e.target.value,
								})
							}
						/>
					</div>
					<div className="flex-1">
						<TagInput
							label="Tags"
							tags={mission.tags}
							onAdd={(tag) => {
								if (mission.tags.includes(tag)) return;
								q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									tags: [...mission.tags, tag],
								});
							}}
							onRemove={(tag) => {
								if (!mission.tags.includes(tag)) return;
								q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									tags: mission.tags.filter((t) => t !== tag),
								});
							}}
						/>
					</div>
				</div>
				<div>
					<h3 className="text-lg font-medium flex items-center">
						Cover Image{" "}
						<InfoTip>
							This is the image that will be displayed on the mission list.
							Should be landscape and 16x9 aspect ratio.
						</InfoTip>
					</h3>
					<UploadWell
						className="aspect-video"
						accept="image/*"
						onChange={async (files) => {
							await q.plugin.timeline.update.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
								cover: files[0],
							});
						}}
					>
						{"cover" in mission.assets && mission?.assets.cover && (
							<img
								src={`${mission.assets.cover}?${Date.now()}`}
								alt="Mission Cover"
								className="w-5/6  object-contain aspect-video"
							/>
						)}
					</UploadWell>
				</div>
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
										timelineType: "missions",
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
							onDragEnd={({ active, overIndex }) =>
								q.plugin.timeline.prerequisiteBlock.reorder.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									blockId: active.id as string,
									newIndex: Number(overIndex),
								})
							}
							onUpdate={(block, property, value) => {
								const { id, type, ...properties } = block;
								q.plugin.timeline.prerequisiteBlock.update.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									blockId: block.id,
									properties: { ...properties, [property]: value },
								});
							}}
							onReplace={(id, blocks) => {
								q.plugin.timeline.prerequisiteBlock.replace.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
									blockId: id,
									blocks,
								});
							}}
							onRemove={(id) =>
								q.plugin.timeline.prerequisiteBlock.delete.netSend({
									pluginId,
									timelineId,
									timelineType: "missions",
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
							timelineType: "missions",
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
