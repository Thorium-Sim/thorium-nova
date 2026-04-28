import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { useParams, Outlet, useNavigate } from "react-router";

export default function TriggerConfig() {
	const { pluginId, macroId } = useParams() as {
		pluginId: string;
		macroId?: string;
	};
	useMenubar({
		backTo: `/config/${pluginId}/list`,
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.macro.all.useNetRequest({
		pluginId,
		type: "trigger",
	});

	const trigger = data.find((d) => d.name === macroId);

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Trigger Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter trigger name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.macro.create.netSend({
									name,
									pluginId,
									type: "trigger",
								});
								void navigate(`${result.macroId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating trigger",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Trigger
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
							category: d.category,
						}))}
						searchKeys={["name"]}
						selectedItem={macroId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={trigger?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
