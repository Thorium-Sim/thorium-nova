import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { Outlet, useNavigate, useParams } from "react-router";

import { DeckNodeContextProvider } from "./shipMap/DeckNodeContext";

export default function ShipConfigLayout() {
	const { pluginId, shipId } = useParams() as {
		pluginId: string;
		shipId?: string;
	};
	const navigate = useNavigate();
	const prompt = usePrompt();
	const [ships] = q.plugin.ship.all.useNetRequest({ pluginId });
	const ship = ships.find((d) => d.name === shipId);
	useMenubar({ backTo: `/config/${pluginId}/list` });

	return (
		<DeckNodeContextProvider>
			<div className="h-[calc(100%-2rem)] p-8">
				<h1 className="mb-4 text-3xl font-bold text-white">Ships Config</h1>
				<div className="flex h-[calc(100%-3rem)] gap-8">
					<div className="flex h-full w-80 flex-col">
						<Button
							className="btn-sm btn-success w-full"
							onClick={async () => {
								const name = await prompt({ header: "Enter ship name" });
								if (typeof name !== "string" || name.trim().length === 0) return;
								try {
									const result = await q.plugin.ship.create.netSend({
										name,
										pluginId,
									});
									navigate(`${result.shipId}`);
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error creating ship",
											body: err.message,
											color: "error",
										});
										return;
									}
								}
							}}
						>
							New Ship
						</Button>

						<SearchableList
							items={ships.map((d) => ({
								id: d.name,
								name: d.name,
								description: d.description,
								category: d.category,
								tags: d.tags,
							}))}
							searchKeys={["name", "category", "tags"]}
							selectedItem={shipId || null}
							setSelectedItem={({ id }) => navigate(`${id}`)}
							renderItem={(c) => (
								<div className="flex items-center justify-between" key={c.id}>
									<div>
										{c.name}
										<div>
											<small>{c.category}</small>
										</div>
									</div>
								</div>
							)}
						/>
					</div>
					<Fragment key={ship?.name}>
						<Outlet />
					</Fragment>
				</div>
			</div>
		</DeckNodeContextProvider>
	);
}
