import { ClientButton } from "@thorium/components/ClientButton";
import { q } from "@thorium/context/AppContext";
import { IPAddress } from "@thorium/routes/landing/IPAddress";
import { cn } from "@thorium/utils/cn";
import { Link } from "react-router";

export function LobbyHeader() {
	const [flight] = q.flight.active.useNetRequest();
	const [client] = q.client.get.useNetRequest();
	return (
		<div className="flex justify-between">
			<div>
				<h2 className="text-white font-bold text-xl mb-2">
					Flight Name: <em>{flight?.name}</em>
				</h2>

				<ClientButton />
				<IPAddress />
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
	);
}
