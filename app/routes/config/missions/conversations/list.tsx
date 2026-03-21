import type { Route } from "./+types/list";

import { useMenubar } from "@thorium/ui/Menubar";
import { useParams, Outlet, useNavigate, href } from "react-router";
import { usePrompt } from "@thorium/ui/AlertDialog";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";

export default function MissionsConfig({
	params: { pluginId, timelineId, conversationId },
}: Route.ComponentProps) {
	useMenubar({
		backTo: href("/config/:pluginId/missions/:timelineId/details", {
			pluginId,
			timelineId,
		}),
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.timeline.conversations.list.useNetRequest({
		pluginId,
		timelineId,
	});

	const conversation = data.find((d) => d.name === conversationId);

	return (
		<div className="pt-10 w-full h-[calc(100%-2rem)]">
			<div className="grid grid-cols-[14rem_1fr] gap-4 h-[calc(100%-3rem)]">
				<div className="flex flex-col w-56 h-full row-span-2">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter conversation name",
							});
							if (typeof name !== "string") return;
							try {
								const result =
									await q.plugin.timeline.conversations.create.netSend({
										name,
										pluginId,
										timelineId,
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
										title: "Error creating mission",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Conversation
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
						}))}
						searchKeys={["name"]}
						selectedItem={conversationId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex justify-between items-center" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={conversation?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
