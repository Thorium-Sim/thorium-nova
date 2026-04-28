import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { Outlet, useNavigate, href } from "react-router";

import type { Route } from "./+types/list";

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
		<div className="h-[calc(100%-2rem)] w-full pt-10">
			<div className="grid h-[calc(100%-3rem)] grid-cols-[14rem_1fr] gap-4">
				<div className="row-span-2 flex h-full w-56 flex-col">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter conversation name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.timeline.conversations.create.netSend({
									name,
									pluginId,
									timelineId,
								});
								navigate(
									href("/config/:pluginId/missions/:timelineId/conversations/:conversationId", {
										pluginId,
										timelineId,
										conversationId: result.conversationId,
									}),
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
							<div className="flex items-center justify-between" key={c.id}>
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
