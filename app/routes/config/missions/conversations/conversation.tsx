import type { Route } from "./+types/conversation";
import { q } from "@thorium/context/AppContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import { href, useNavigate } from "react-router";
import debounce from "lodash.debounce";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import { AspectAssetUpload } from "@thorium/components/AspectAssetUpload";
import Editor from "@monaco-editor/react";
import { registerInk } from "@thorium/components/ink/registerInk";
import { registerInkValidator } from "@thorium/components/ink/validateInk";
import { Activity, useState } from "react";
import { cn } from "@thorium/utils/cn";
import { registerInkCompletions } from "@thorium/components/ink/inkCompletions";

function parseParams(value: any) {
	return value.properties
		? Object.entries(value.properties).flatMap(([name, value]) =>
				["number", "string", "boolean"].includes((value as any).type)
					? name
					: Array.isArray((value as any).type) &&
							(value as any).type.some((v) =>
								["number", "string", "boolean"].includes(v),
							)
						? name
						: (value as any).anyOf?.some((v: { type: string }) =>
									["number", "string", "boolean"].includes(v.type),
								)
							? name
							: [],
			)
		: [];
}
export default function Conversations({
	params: { pluginId, timelineId, conversationId },
}: Route.ComponentProps) {
	const [conversation] = q.plugin.timeline.conversations.get.useNetRequest({
		pluginId,
		conversationId,
	});
	const [actions] = q.thorium.actions.useNetRequest();
	const actionsMap = actions.map((a) => ({
		name: a.action,
		params: parseParams(a.input),
	}));

	const [events] = q.thorium.events.useNetRequest();
	const eventsMap = events.map((e) => ({
		name: e.event,
		params: parseParams(e.output),
	}));

	const navigate = useNavigate();
	const confirm = useConfirm();
	const prompt = usePrompt();
	const [assetsShown, setAssetsShown] = useState(false);
	return (
		<>
			<div className="relative">
				<Editor
					className={cn({ "pointer-events-none opacity-50": assetsShown })}
					defaultValue={conversation.text}
					onChange={debounce(
						async (e) => {
							await q.plugin.timeline.conversations.update.netSend({
								pluginId,
								conversationId,
								text: e,
							});
						},
						300,
						{ trailing: true, maxWait: 1000 },
					)}
					theme="vs-dark"
					language="ink"
					options={{
						minimap: {
							enabled: false,
						},
						wordWrap: "on",
					}}
					onMount={(editor, monaco) => {
						registerInk(monaco);
						registerInkValidator(monaco);
						registerInkCompletions(monaco, actionsMap, eventsMap);
					}}
				/>
				<Activity mode={assetsShown ? "visible" : "hidden"}>
					<div className="flex flex-col h-full w-full top-0 left-0 absolute">
						<AspectAssetUpload
							fileUrls={conversation.assets.files}
							handleUpload={async (files) => {
								if (!files.length) return;
								const file = files[0];
								await q.plugin.timeline.conversations.uploadFile.netSend({
									pluginId,
									conversationId,
									file,
									fileName: file.name,
								});
							}}
							remove={async (file) => {
								await q.plugin.timeline.conversations.removeFile.netSend({
									pluginId,
									conversationId,
									file,
								});
							}}
						/>
					</div>
				</Activity>
			</div>
			<div className="col-start-2 row-start-2 flex gap-4">
				<Button
					className="btn-outline btn-error"
					disabled={!conversationId}
					onClick={async () => {
						if (
							!conversationId ||
							!(await confirm({
								header: "Are you sure you want to delete this conversation?",
								body: "All content for this conversation, including images, audio, and other assets, will be gone forever.",
							}))
						)
							return;
						q.plugin.timeline.conversations.delete.netSend({
							pluginId,
							conversationId,
						});
						navigate(
							href("/config/:pluginId/missions/:timelineId/conversations", {
								pluginId,
								timelineId,
							}),
						);
					}}
				>
					Delete Conversation
				</Button>
				<Button
					className="btn-outline btn-notice"
					disabled={!conversationId}
					onClick={async () => {
						if (!pluginId) return;
						const name = await prompt({
							header: "What is the name of the duplicated plugin?",
						});
						if (!name || typeof name !== "string") return;
						try {
							const result =
								await q.plugin.timeline.conversations.duplicate.netSend({
									pluginId,
									conversationId,
									name,
								});
							navigate(
								href(
									"/config/:pluginId/missions/:timelineId/conversations/:conversationId",
									{
										pluginId,
										timelineId,
										conversationId: result.conversationId,
									},
								),
							);
						} catch (err) {
							if (err instanceof Error) {
								toast({
									title: "Error duplicating conversation",
									body: err.message,
									color: "error",
								});
								return;
							}
						}
					}}
				>
					Duplicate Conversation
				</Button>
				<Button
					className="btn-outline btn-info"
					onClick={() => setAssetsShown((a) => !a)}
				>
					Assets
				</Button>
			</div>
		</>
	);
}
