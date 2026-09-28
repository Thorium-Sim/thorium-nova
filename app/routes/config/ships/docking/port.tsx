import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { DockingPortContext } from "@thorium/routes/config/ships/docking/context";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import { shipCategories } from "@thorium/utils/flags/shipClasses";
import { use } from "react";
import { href, useNavigate } from "react-router";

import type { Route } from "./+types/port";

export default function DockingPortsConfig({
	params: { pluginId, shipId, portId },
}: Route.ComponentProps) {
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });

	const { pickPoint } = use(DockingPortContext);
	const port = data.dockingPorts.find((p) => p.name === portId);
	const navigate = useNavigate();
	if (!port) {
		navigate(".");
		return null;
	}

	return (
		<>
			<Input
				label="Name"
				placeholder="Docking Port 1"
				defaultValue={port.name}
				onBlur={async (e: any) => {
					if (e.target.value === port.name) return;
					try {
						const result = await q.plugin.ship.dockingPort.update.netSend({
							pluginId,
							shipId,
							portId,
							newName: e.target.value,
						});
						navigate(
							href("/config/:pluginId/ships/:shipId/docking/:portId", {
								pluginId,
								shipId,
								portId: result.name,
							}),
						);
					} catch (err) {
						if (err instanceof Error) {
							toast({
								title: "Error renaming docking port",
								body: err.message,
								color: "error",
							});
						}
					}
				}}
			/>
			<Button className="btn-success btn-sm my-2 w-full" onClick={pickPoint}>
				Reposition
			</Button>
			<label>Incoming Categories</label>
			<div className="grid grid-cols-2">
				{shipCategories.options.map((o) => (
					<Checkbox
						key={o}
						label={o}
						name={o}
						defaultChecked={port.incomingCategories.includes(o)}
						onChange={(e) => {
							void q.plugin.ship.dockingPort.update.netSend({
								pluginId,
								shipId,
								portId,
								incomingCategories: e.currentTarget.checked
									? [...port.incomingCategories, o]
									: port.incomingCategories.filter((c) => c !== o),
							});
						}}
					/>
				))}
			</div>
			<p className="mb-2 text-sm leading-tight text-gray-400">
				What categories of ships are able to initiate docking with this docking port.
			</p>
			<Checkbox
				label="Allow Outgoing"
				helperText="Allow this docking port to initiate docking with other docking ports. By convention, ships should only have one outgoing docking port."
				defaultChecked={port.allowOutgoing}
				onChange={(e) =>
					void q.plugin.ship.dockingPort.update.netSend({
						pluginId,
						shipId,
						portId,
						allowOutgoing: e.currentTarget.checked,
					})
				}
			/>
		</>
	);
}
