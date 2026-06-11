import { Navigate } from "@thorium/components/Navigate";
import { PrerequisiteBlocks } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import { useState } from "react";
import { href, useNavigate, useParams } from "react-router";

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
			className="grid flex-1 grid-cols-2 grid-rows-[auto_1fr] gap-4 overflow-y-auto px-1"
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
								navigate(
									href("/config/:pluginId/missions/:timelineId/details", {
										pluginId,
										timelineId: result.timelineId,
									}),
								);
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
						className="h-32!"
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
				<div className="flex gap-2 pb-4">
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
					<h3 className="flex items-center text-lg font-medium">
						Cover Image{" "}
						<InfoTip>
							This is the image that will be displayed on the mission list. Should be landscape and
							16x9 aspect ratio.
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
								className="aspect-video w-5/6 object-contain"
							/>
						)}
					</UploadWell>
				</div>
			</div>
			<PrerequisiteBlocks
				pluginId={pluginId}
				timelineId={timelineId}
				timelineType="missions"
				prerequisiteBlocks={prerequisiteBlocks}
			/>
		</fieldset>
	);
}
