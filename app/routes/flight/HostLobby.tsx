import type { ClientSettings as IClientSettings } from "@thorium/.server/data";
import { q, clientId } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import { Menu, MenuItem, MenuTrigger } from "@thorium/ui/Menu";
import Menubar, { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { cn } from "@thorium/utils/cn";
import { type Dispatch, type SetStateAction, useState } from "react";
import { Header, Button as RAButton } from "react-aria-components";
import { Link, Outlet, useNavigate } from "react-router";

import { LobbyHeader } from "./LobbyHeader";
import { staticStations } from "./staticStations";
import { WaitingForFlight } from "./WaitingForFlight";

export function HostLobby() {
	const [flight] = q.flight.active.useNetRequest();
	const [client] = q.client.get.useNetRequest({ clientId });

	return (
		<Menubar>
			<div className="flex h-full bg-black/50 p-4 backdrop-blur backdrop-filter">
				<LobbyHeader />
				<div className="flex flex-1 flex-col pt-16">
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
			<Outlet />
		</Menubar>
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
		<div className="flex w-full justify-around gap-4">
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
						<div className="flex gap-2">
							<h3 className="text-xl font-bold">{ship.name}</h3>
							<MenuTrigger>
								<RAButton className="cursor-pointer">
									<Icon name="settings"></Icon>
								</RAButton>
								<Menu>
									<MenuItem
										onAction={async () => {
											for (const client of clients) {
												if (client.shipId === ship.id) {
													await q.client.setSettings.netSend({
														clientId: client.clientId,
														settings: {
															...client.settings,
															ambiancePlayer: false,
															dialoguePlayer: false,
															musicPlayer: false,
															soundPlayer: false,
														},
													});
												}
											}
										}}
									>
										Deactivate All Client Audio
									</MenuItem>
									<MenuItem
										onAction={async () => {
											for (const client of clients) {
												if (client.shipId === ship.id) {
													await q.client.setSettings.netSend({
														clientId: client.clientId,
														settings: {
															...client.settings,
															ambiancePlayer: true,
															dialoguePlayer: true,
															musicPlayer: true,
															soundPlayer: true,
														},
													});
												}
											}
										}}
									>
										Activate All Client Audio
									</MenuItem>
								</Menu>
							</MenuTrigger>
						</div>
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
						className={`btn-xs btn-success ${!selectedClient ? "btn-disabled" : ""}`}
						onClick={async () => {
							try {
								await q.client.setStation.netSend({
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
						<div className="flex items-center gap-2 pl-4">
							{client.name} <div className="grow" />
							<ClientSettings client={client} />
							<button
								className="cursor-pointer text-red-600"
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									q.client.setStation.netSend({
										shipId: null,
										clientId: client.clientId,
									});
								}}
							>
								<Icon name="ban" />
							</button>
						</div>
					</li>
				))}
		</>
	);
}

function ClientSettings({ client }: { client: { clientId: string; settings: IClientSettings } }) {
	return (
		<MenuTrigger>
			<RAButton className="cursor-pointer">
				<Icon name="settings"></Icon>
			</RAButton>
			<Menu
				selectionMode="multiple"
				selectedKeys={(
					["soundPlayer", "ambiancePlayer", "musicPlayer", "dialoguePlayer"] as const
				).filter((key) => client.settings[key])}
				onSelectionChange={(keys) => {
					const selection =
						keys === "all"
							? new Set(["soundPlayer", "ambiancePlayer", "musicPlayer", "dialoguePlayer"])
							: keys;
					q.client.setSettings.netSend({
						clientId: client.clientId,
						settings: {
							...client.settings,
							soundPlayer: selection.has("soundPlayer"),
							ambiancePlayer: selection.has("ambiancePlayer"),
							musicPlayer: selection.has("musicPlayer"),
							dialoguePlayer: selection.has("dialoguePlayer"),
						},
					});
				}}
			>
				<Header className="px-2 font-bold">Settings</Header>
				<MenuItem id="soundPlayer">Sound Player</MenuItem>
				{/* TODO March 26, 2026 — some day we'll make it so different ambiance tracks
										play on different clients, so the bridge has different ambiance than the engineering
										or sickbay rooms on the set. */}
				<MenuItem id="ambiancePlayer">Ambiance Player</MenuItem>
				<MenuItem id="musicPlayer">Music Player</MenuItem>
				<MenuItem id="dialoguePlayer">Dialogue Player</MenuItem>
			</Menu>
		</MenuTrigger>
	);
}
