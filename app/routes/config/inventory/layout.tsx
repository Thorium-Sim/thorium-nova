import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { useParams, useNavigate, Outlet } from "react-router";

export default function InventoryList() {
	const { pluginId, inventoryId } = useParams() as {
		pluginId: string;
		inventoryId?: string;
	};
	useMenubar({ backTo: `/config/${pluginId}/list` });

	const navigate = useNavigate();
	const prompt = usePrompt();
	const [data] = q.plugin.inventory.all.useNetRequest({ pluginId });
	const inventory = data.find((d) => d.name === inventoryId);

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Inventory Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter inventory item name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.inventory.create.netSend({
									name,
									pluginId,
								});
								void navigate(`${result.inventoryId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating inventory item",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Inventory Item
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
						}))}
						searchKeys={["name"]}
						selectedItem={inventoryId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={inventory?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
