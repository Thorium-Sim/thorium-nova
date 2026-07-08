import { Navigate } from "@thorium/components/Navigate";
import { PrerequisiteBlocks } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import { useState } from "react";
import { href, useNavigate } from "react-router";

import type { Route } from "./+types/details";

export default function TrainingDetails({
	params: { pluginId, timelineId },
}: Route.ComponentProps) {
	const [training] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "trainings",
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!training) return <Navigate to={href("/config/:pluginId/trainings", { pluginId })} />;

	const { prerequisiteBlocks } = training;
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
						label="Training Name"
						placeholder="Pilot"
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
								void navigate(
									href("/config/:pluginId/trainings/:timelineId", {
										pluginId,
										timelineId: result.timelineId,
									}),
								);
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
						className="h-32!"
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
						void q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "trainings",
							tags: [...training.tags, tag],
						});
					}}
					onRemove={(tag) => {
						if (!training.tags.includes(tag)) return;
						void q.plugin.timeline.update.netSend({
							pluginId,
							timelineId,
							timelineType: "trainings",
							tags: training.tags.filter((t) => t !== tag),
						});
					}}
				/>
			</div>
			<PrerequisiteBlocks
				pluginId={pluginId}
				timelineId={timelineId}
				timelineType="trainings"
				prerequisiteBlocks={prerequisiteBlocks}
			/>
		</fieldset>
	);
}
