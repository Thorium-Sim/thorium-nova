import type { Route } from "./+types/conversation";
import { Editor } from "@thorium/components/MonacoEditor";
import { q } from "@thorium/context/AppContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import { href, useNavigate } from "react-router";
import debounce from "lodash.debounce";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";

export default function Conversations({
	params: { pluginId, timelineId, conversationId },
}: Route.ComponentProps) {
	const [conversation] = q.plugin.timeline.conversations.get.useNetRequest({
		pluginId,
		conversationId,
	});
	const navigate = useNavigate();
	const confirm = useConfirm();
	const prompt = usePrompt();

	return (
		<div className="flex w-full gap-8">
			<div className="flex-col grow flex gap-2 h-full">
				<Editor
					className="flex-1"
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
					language="less"
					options={{
						minimap: {
							enabled: false,
						},
					}}
				/>

				<div className="flex gap-4">
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
				</div>
			</div>
			<div className="flex-1 flex grow-0 flex-col w-[384px]"></div>
		</div>
	);
}
