import {q} from "@client/context/AppContext";
import Menubar from "@thorium/ui/Menubar";
import {WaitingForFlight} from "./WaitingForFlight";
import {staticStations} from "./staticStations";
import {toast} from "@client/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import {LobbyHeader} from "./LobbyHeader";

export function PlayerLobby() {
  const [flight] = q.flight.active.useNetRequest();

  return (
    <>
      <Menubar>
        <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur">
          <LobbyHeader />
          <div className="flex-1 flex flex-col pt-16">
            {flight ? <PlayerStationSelection /> : <WaitingForFlight />}
          </div>
        </div>
      </Menubar>
    </>
  );
}

function PlayerStationSelection() {
  const [playerShips] = q.ship.players.useNetRequest();
  return (
    <>
      <h1 className="text-center text-4xl font-bold mb-8">Choose a Station</h1>
      <div className="flex-1 flex justify-center gap-8">
        {playerShips.map(ship => (
          <div key={ship.id}>
            <h3 className="text-xl font-bold">{ship.name}</h3>
            <ul>
              {ship.stations.map(station => (
                <PlayerStationItem
                  shipId={ship.id}
                  station={station}
                  key={station.name}
                />
              ))}
              {/* TODO April 23, 2022 - Hide this when the ship is configured to not have a flight director */}
              {staticStations.map(station => (
                <PlayerStationItem
                  key={station.name}
                  shipId={ship.id}
                  station={station}
                />
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
  station: {name: string; description: string};
}) {
  const [clients] = q.client.all.useNetRequest();

  return (
    <>
      <li
        className="list-group-item"
        key={station.name}
        role="button"
        onClick={async () => {
          try {
            await q.client.setStation.netSend({
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
        .filter(c => c.shipId === shipId && c.stationId === station.name)
        .map(client => (
          <li
            key={client.id}
            className={`list-group-item list-group-item-small`}
          >
            <div className="pl-4 flex items-center justify-between">
              {client.name}
            </div>
          </li>
        ))}
    </>
  );
}
