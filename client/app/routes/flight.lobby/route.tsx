import { q } from "@client/context/AppContext";
import { PlayerLobby } from "./PlayerLobby";
import { HostLobby } from "./HostLobby";

export default function FlightLobby() {
	const [client] = q.client.get.useNetRequest();

	if (client.isHost) return <HostLobby />;
	return <PlayerLobby />;
}
