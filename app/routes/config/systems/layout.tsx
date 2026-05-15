import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Dropdown, { DropdownItem } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { capitalCase } from "change-case";
import { Fragment, Suspense } from "react";
import { Button } from "react-aria-components";
import { Outlet, useParams, useNavigate } from "react-router";

export default function ShipSystemsList() {
	const { pluginId } = useParams() as {
		pluginId: string;
	};
	useMenubar({ backTo: `/config/${pluginId}/list` });
	return (
		<div className="h-full">
			<Suspense>
				<ShipSystemsInner />
			</Suspense>
		</div>
	);
}

function ShipSystemsInner() {
	const { pluginId, systemId } = useParams() as {
		pluginId: string;
		systemId?: string;
	};
	const navigate = useNavigate();
	const prompt = usePrompt();
	const [data] = q.plugin.systems.all.useNetRequest({ pluginId });
	const [availableShipSystems] = q.plugin.systems.available.useNetRequest();
	const system = data.find((d) => d.name === systemId);

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Ship Systems Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Dropdown
						triggerEl={
							<Button className="btn btn-success btn-sm w-full">
								New Ship System <Icon name="chevron-down" />
							</Button>
						}
					>
						{availableShipSystems.map((system) => (
							<DropdownItem
								key={system.type}
								onClick={async () => {
									const name = await prompt({
										header: "Enter system name",
										defaultValue: capitalCase(system.type),
									});
									if (typeof name !== "string") return;
									try {
										const result = await q.plugin.systems.create.netSend({
											name,
											type: system.type,
											pluginId,
										});
										navigate(`${result.shipSystemId}`);
									} catch (err) {
										if (err instanceof Error) {
											toast({
												title: "Error creating system",
												body: err.message,
												color: "error",
											});
											return;
										}
									}
								}}
							>
								{capitalCase(system.type)}
							</DropdownItem>
						))}
					</Dropdown>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
							category: capitalCase(d.type),
							flightModes: d.flightModes,
							tags: d.tags,
						}))}
						searchKeys={["name", "category", "tags"]}
						selectedItem={systemId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>
									{c.name}
									<div>
										<small>{c.category}</small>
										{c.flightModes.length === 1 ? (
											<>
												{" "}
												- <small className="italic">{capitalCase(c.flightModes[0])}</small>
											</>
										) : null}
									</div>
								</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={system?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
