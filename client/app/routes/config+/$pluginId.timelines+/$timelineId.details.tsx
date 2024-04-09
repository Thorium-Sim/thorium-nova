import { q } from "@client/context/AppContext";
import { toast } from "@client/context/ToastContext";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import { useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { Navigate } from "@client/components/Navigate";

export default function TimelineDetails() {
	const { pluginId, timelineId } = useParams() as {
		pluginId: string;
		timelineId: string;
	};
	const [timeline] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!timeline) return <Navigate to={`/config/${pluginId}/timelines`} />;
	return (
		<fieldset
			key={timelineId}
			className="flex-1 overflow-y-auto max-w-3xl px-1"
		>
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="pb-4">
						<Input
							labelHidden={false}
							isInvalid={error}
							invalidMessage="Name is required"
							label="Timeline Name"
							placeholder="Eclipse"
							defaultValue={timeline.name}
							onChange={() => setError(false)}
							onBlur={async (e: any) => {
								if (!e.target.value) return setError(true);
								try {
									const result = await q.plugin.timeline.update.netSend({
										pluginId,
										timelineId,
										name: e.target.value,
									});
									navigate(
										`/config/${pluginId}/timelines/${result.timelineId}`,
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
							className="!h-32"
							labelHidden={false}
							label="Description"
							defaultValue={timeline.description}
							onBlur={(e: any) =>
								q.plugin.timeline.update.netSend({
									pluginId,
									timelineId,
									description: e.target.value,
								})
							}
						/>
					</div>

					<div className="pb-4 flex gap-2">
						<div className="flex-1">
							<Input
								labelHidden={false}
								label="Category"
								type="textarea"
								defaultValue={timeline.category}
								onBlur={(e: any) =>
									q.plugin.timeline.update.netSend({
										pluginId,
										timelineId,
										category: e.target.value,
									})
								}
							/>
						</div>
						<div className="flex-1">
							<TagInput
								label="Tags"
								tags={timeline.tags}
								onAdd={(tag) => {
									if (timeline.tags.includes(tag)) return;
									q.plugin.timeline.update.netSend({
										pluginId,
										timelineId,
										tags: [...timeline.tags, tag],
									});
								}}
								onRemove={(tag) => {
									if (!timeline.tags.includes(tag)) return;
									q.plugin.timeline.update.netSend({
										pluginId,
										timelineId,
										tags: timeline.tags.filter((t) => t !== tag),
									});
								}}
							/>
						</div>
					</div>
					<Checkbox
						label="Mission"
						helperText="Check this box to include this mission option when starting a flight."
						checked={timeline.isMission}
						onChange={(event) =>
							q.plugin.timeline.update.netSend({
								pluginId,
								timelineId,
								isMission: event.target.checked,
							})
						}
					/>
					{timeline.isMission ? (
						<div className="max-w-sm">
							<h3 className="text-lg font-bold flex items-center">
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
										cover: files[0],
									});
								}}
							>
								{timeline?.assets.cover && (
									<img
										src={`${timeline.assets.cover}?${new Date().getTime()}`}
										alt="Mission Cover"
										className="w-5/6  object-contain aspect-video"
									/>
								)}
							</UploadWell>
						</div>
					) : null}
				</div>
			</div>
		</fieldset>
	);
}
