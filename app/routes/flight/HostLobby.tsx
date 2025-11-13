import { q, clientId } from "@thorium/context/AppContext";
import Menubar, { useMenubar } from "@thorium/ui/Menubar";
import { WaitingForFlight } from "./WaitingForFlight";
import { Link, NavLink, useNavigate } from "react-router";
import Button from "@thorium/ui/Button";
import { type Dispatch, type SetStateAction, useState } from "react";
import SearchableList from "@thorium/ui/SearchableList";
import InfoTip from "@thorium/ui/InfoTip";
import { toast } from "@thorium/context/ToastContext";
import { Icon } from "@thorium/ui/Icon";
import { staticStations } from "./staticStations";
import { LobbyHeader } from "./LobbyHeader";
import { cn } from "@thorium/utils/cn";

export function HostLobby() {
	const [flight] = q.flight.active.useNetRequest();
	const [client] = q.client.get.useNetRequest({ clientId });

	return (
		<>
			<Menubar>
				<div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur flex">
					<LobbyHeader />
					<div className="flex-1 flex flex-col pt-16">
						{flight ? <ClientAssignment /> : <WaitingForFlight />}
					</div>
					{client.stationId === "Flight Director" ? (
						<Link to="/flight/core" className="btn btn-lg btn-warning">
							Go To Core
						</Link>
					) : (
						<Link
							to="/flight/station"
							className={cn("btn btn-lg btn-success", {
								"btn-disabled": !client.stationId,
							})}
							aria-disabled={!client.stationId}
						>
							Go To Station
						</Link>
					)}
				</div>

				<FlightButtons />
			</Menubar>
		</>
	);
}
function FlightButtons() {
	const navigate = useNavigate();
	const [flight] = q.flight.active.useNetRequest();
	useMenubar({
		children: flight ? (
			<>
				<Button
					className="btn btn-outline btn-xs btn-error"
					onClick={async () => {
						await q.flight.stop.netSend();
						navigate("/");
					}}
				>
					End
				</Button>
				{flight?.paused ? (
					<Button
						className="btn btn-outline btn-xs btn-success"
						onClick={() => {
							q.flight.resume.netSend();
						}}
					>
						Resume
					</Button>
				) : (
					<Button
						className="btn btn-outline btn-xs btn-warning"
						onClick={() => {
							q.flight.pause.netSend();
						}}
					>
						Pause
					</Button>
				)}
				<Button
					className="btn btn-outline btn-xs btn-notice"
					onClick={() => {
						q.flight.reset.netSend();
					}}
				>
					Reset
				</Button>
			</>
		) : null,
	});

	return null;
}
function ClientAssignment() {
	const [clients] = q.client.all.useNetRequest();
	const [client] = q.client.get.useNetRequest({ clientId });
	const [playerShips] = q.ship.players.useNetRequest();
	const [selectedClient, setSelectedClient] = useState(client.id);
	const [flight] = q.flight.active.useNetRequest();

	return (
		<div className="flex justify-around gap-4 w-full">
			<div>
				<h3 className="text-xl font-bold">Unassigned Clients</h3>
				<SearchableList
					showSearchLabel={false}
					selectedItem={selectedClient}
					setSelectedItem={({ id }) => setSelectedClient(id)}
					items={clients
						.filter((c) => c.shipId === null || c.shipId === undefined)
						.map((c) => ({
							id: c.clientId,
							label: c.name,
						}))}
				/>
			</div>
			<div className="flex flex-wrap justify-center">
				{playerShips.map((ship) => (
					<div key={ship.id}>
						<h3 className="text-xl font-bold">{ship.name}</h3>
						<ul>
							{ship.stations.map((station) => (
								<HostStationItem
									shipId={ship.id}
									station={station}
									key={station.name}
									selectedClient={selectedClient}
									setSelectedClient={setSelectedClient}
								/>
							))}
							{flight?.hasFlightDirector
								? staticStations.map((station) => (
										<HostStationItem
											key={station.name}
											shipId={ship.id}
											station={station}
											selectedClient={selectedClient}
											setSelectedClient={setSelectedClient}
										/>
									))
								: null}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
}
function HostStationItem({
	shipId,
	station,
	selectedClient,
	setSelectedClient,
}: {
	shipId: number;
	station: { name: string; description: string };
	selectedClient: string;
	setSelectedClient: Dispatch<SetStateAction<string>>;
}) {
	const [clients] = q.client.all.useNetRequest();

	return (
		<>
			<li className="list-group-item" key={station.name}>
				<span className="flex justify-between gap-2">
					<span className="flex-1">{station.name}</span>{" "}
					<Button
						className={`btn-xs btn-success ${
							!selectedClient ? "btn-disabled" : ""
						}`}
						onClick={async () => {
							try {
								const result = await q.client.setStation.netSend({
									shipId: shipId,
									stationId: station.name,
									clientId: selectedClient,
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error assigning station",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					>
						Assign
					</Button>
					<InfoTip>{station.description}</InfoTip>
				</span>
			</li>
			{clients
				.filter((c) => c.shipId === shipId && c.stationId === station.name)
				.map((client) => (
					<li
						key={client.clientId}
						className={`list-group-item list-group-item-small ${
							selectedClient === client.clientId ? "selected" : ""
						}`}
						onClick={() => setSelectedClient(client.clientId)}
					>
						<div className="pl-4 flex items-center justify-between">
							{client.name}{" "}
							<Icon
								name="ban"
								className="text-red-600 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									q.client.setStation.netSend({
										shipId: null,
										clientId: client.clientId,
									});
								}}
							/>
						</div>
					</li>
				))}
		</>
	);
}
