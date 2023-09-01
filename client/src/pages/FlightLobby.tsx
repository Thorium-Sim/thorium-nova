import {FaBan, FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import SearchableList from "../components/ui/SearchableList";
import {Dispatch, SetStateAction, useState} from "react";
import {toast} from "../context/ToastContext";
import Menubar, {useMenubar} from "@thorium/ui/Menubar";
import {NavLink, useNavigate} from "react-router-dom";
import StationWrapper from "../components/Station";
import {ClientButton} from "../components/ClientButton";
import InfoTip from "@thorium/ui/InfoTip";
import {q} from "@client/context/AppContext";

export default function FlightLobby() {
  const [station] = q.station.get.useNetRequest();
  const [client] = q.client.get.useNetRequest();

  if (station) return <StationWrapper />;

  if (client.isHost) return <HostLobby />;
  return <PlayerLobby />;
}

function PlayerLobby() {
  const [flight] = q.flight.active.useNetRequest();

  return (
    <>
      <Menubar>
        <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur">
          <h2 className="text-white font-bold text-xl mb-2">
            Flight Name: <em>{flight?.name}</em>
          </h2>

          <ClientButton />

          <div className="flex-1 flex flex-col pt-16">
            {flight ? <PlayerStationSelection /> : <WaitingForFlight />}
          </div>
        </div>
      </Menubar>
    </>
  );
}

const staticStations = [
  {
    name: "Viewscreen",
    description: "Outside view of the space around the ship.",
  },
  {
    name: "Flight Director",
    description: "Behind-the-scenes station for controlling the flight.",
  },
];
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
function HostLobby() {
  const [flight] = q.flight.active.useNetRequest();

  return (
    <>
      <Menubar>
        <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur flex flex-col">
          <h2 className="text-white font-bold text-xl mb-2">
            Flight Name: <em>{flight?.name}</em>
          </h2>

          <ClientButton />
          <div className="flex-1 flex flex-col pt-16">
            {flight ? <ClientAssignment /> : <WaitingForFlight />}
          </div>
        </div>
        <FlightButtons />
      </Menubar>
    </>
  );
}

function FlightButtons() {
  const navigate = useNavigate();
  const [flight] = q.flight.active.useNetRequest();
  const [client] = q.client.get.useNetRequest();
  useMenubar({
    children: flight ? (
      <>
        {client.isHost && (
          <Button
            className="btn btn-outline btn-xs btn-error"
            onClick={async () => {
              await q.flight.stop.netSend();
              navigate("/");
            }}
          >
            End
          </Button>
        )}
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
        {process.env.NODE_ENV !== "production" && (
          <NavLink className="btn btn-xs btn-info btn-outline" to="/cards">
            Cards
          </NavLink>
        )}
      </>
    ) : null,
  });

  return null;
}

function ClientAssignment() {
  const [clients] = q.client.all.useNetRequest();
  const [client] = q.client.get.useNetRequest();
  const [playerShips] = q.ship.players.useNetRequest();
  const [selectedClient, setSelectedClient] = useState(client.id);
  return (
    <div className="flex justify-around gap-4 w-full">
      <div>
        <h3 className="text-xl font-bold">Unassigned Clients</h3>
        <SearchableList
          showSearchLabel={false}
          selectedItem={selectedClient}
          setSelectedItem={({id}) => setSelectedClient(id)}
          items={clients
            .filter(c => c.shipId === null || c.shipId === undefined)
            .map(c => ({
              id: c.id,
              label: c.name,
            }))}
        />
      </div>
      <div className="flex flex-wrap justify-center">
        {playerShips.map(ship => (
          <div key={ship.id}>
            <h3 className="text-xl font-bold">{ship.name}</h3>
            <ul>
              {ship.stations.map(station => (
                <HostStationItem
                  shipId={ship.id}
                  station={station}
                  key={station.name}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                />
              ))}
              {/* TODO April 23, 2022 - Hide this when the ship is configured to not have a flight director */}
              {staticStations.map(station => (
                <HostStationItem
                  key={station.name}
                  shipId={ship.id}
                  station={station}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                />
              ))}
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
  station: {name: string; description: string};
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
        .filter(c => c.shipId === shipId && c.stationId === station.name)
        .map(client => (
          <li
            key={client.id}
            className={`list-group-item list-group-item-small ${
              selectedClient === client.id ? "selected" : ""
            }`}
            onClick={() => setSelectedClient(client.id)}
          >
            <div className="pl-4 flex items-center justify-between">
              {client.name}{" "}
              <FaBan
                className="text-red-600 cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  q.client.setStation.netSend({
                    shipId: null,
                    clientId: client.id,
                  });
                }}
              />
            </div>
          </li>
        ))}
    </>
  );
}

function WaitingForFlight() {
  return (
    <>
      <h1 className="text-6xl text-white font-bold text-center">
        Waiting for Flight to Start...
      </h1>
      <FaSpinner className="animate-spin-step text-4xl text-white mx-auto mt-4" />
    </>
  );
}
