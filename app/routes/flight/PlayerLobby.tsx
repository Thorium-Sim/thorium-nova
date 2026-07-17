import { q, clientId } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import Menubar from "@thorium/ui/Menubar";

import { LobbyHeader } from "./LobbyHeader";
import { staticStations } from "./staticStations";
import { WaitingForFlight } from "./WaitingForFlight";

export function PlayerLobby() {
	const [flight] = q.flight.active.useNetRequest();

	return (
		<Menubar>
			<div className="h-full bg-black/50 p-4 backdrop-blur backdrop-filter">
				<LobbyHeader />
				<div className="flex flex-1 flex-col pt-16">
					{flight ? <PlayerStationSelection /> : <WaitingForFlight />}
				</div>
			</div>
		</Menubar>
	);
}

function PlayerStationSelection() {
	const [playerShips] = q.ship.players.useNetRequest();
	return (
		<>
			<h1 className="mb-8 text-center text-4xl font-bold">Choose a Station</h1>
			<div className="flex flex-1 justify-center gap-8">
				{playerShips.map((ship) => (
					<div key={ship.id}>
						<h3 className="text-xl font-bold">{ship.name}</h3>
						<ul>
							{ship.stations.map((station) => (
								<PlayerStationItem shipId={ship.id} station={station} key={station.name} />
							))}
							{/* TODO April 23, 2022 - Hide this when the ship is configured to not have a flight director */}
							{staticStations.map((station) => (
								<PlayerStationItem key={station.name} shipId={ship.id} station={station} />
							))}
						</ul>
					</div>
				))}
			</div>
		</>
	);
}

function PlayerStationItem({
	shipId,
	station,
}: {
	shipId: number;
	station: { name: string; description?: string };
}) {
	const [clients] = q.client.all.useNetRequest();

	return (
		<>
			<li
				className="list-group-item"
				key={station.name}
				onClick={async () => {
					try {
						await q.client.setStation.netSend({
							clientId,
							shipId: shipId,
							stationId: station.name,
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
				<div className="flex justify-between">
					<span>{station.name}</span>
					<InfoTip>{station.description}</InfoTip>
				</div>
			</li>
			{clients
				.filter((c) => c.shipId === shipId && c.stationId === station.name)
				.map((client) => (
					<li key={client.clientId} className={`list-group-item list-group-item-small`}>
						<div className="flex items-center justify-between pl-4">{client.name}</div>
					</li>
				))}
		</>
	);
}
