import { useMenubar } from "@thorium/ui/Menubar";
import { useParams, Outlet, useNavigate } from "react-router";
import { usePrompt } from "@thorium/ui/AlertDialog";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";

export default function BridgesConfig() {
	const { pluginId, bridgeId } = useParams() as {
		pluginId: string;
		bridgeId?: string;
	};
	useMenubar({
		backTo: `/config/${pluginId}/list`,
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.bridge.all.useNetRequest({ pluginId });
	const bridges = Array.isArray(data) ? data : [];

	const selected = bridges.find((d) => d.name === bridgeId);

	return (
		<div className="p-8 h-[calc(100%-2rem)]">
			<h1 className="font-bold text-white text-3xl mb-4">Bridges</h1>
			<div className="flex gap-8 h-[calc(100%-3rem)]">
				<div className="flex flex-col w-80 h-full">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter bridge name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.bridge.create.netSend({
									name,
									pluginId,
								});
								navigate(encodeURIComponent(result.bridgeId));
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating bridge",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					>
						New Bridge
					</Button>

					<SearchableList
						items={bridges.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
						}))}
						searchKeys={["name"]}
						selectedItem={bridgeId || null}
						setSelectedItem={({ id }) => navigate(encodeURIComponent(id))}
						renderItem={(c) => (
							<div className="flex justify-between items-center" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={selected?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
