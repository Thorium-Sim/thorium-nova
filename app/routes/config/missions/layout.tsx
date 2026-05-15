import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { useParams, Outlet, useNavigate } from "react-router";

export default function MissionsConfig() {
	const { pluginId, timelineId } = useParams() as {
		pluginId: string;
		timelineId?: string;
	};
	useMenubar({
		backTo: `/config/${pluginId}/list`,
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.timeline.missions.useNetRequest({ pluginId });

	const mission = data.find((d) => d.name === timelineId);

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Mission Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter mission name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.timeline.create.netSend({
									name,
									pluginId,
									timelineType: "missions",
								});
								navigate(`${result.timelineId}`);
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
						New Mission
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
						}))}
						searchKeys={["name"]}
						selectedItem={timelineId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={mission?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
