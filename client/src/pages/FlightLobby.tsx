import {FaBan, FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";
import {useNetRequest} from "../context/useNetRequest";
import SearchableList from "../components/ui/SearchableList";
import {Dispatch, SetStateAction, useState} from "react";
import {toast} from "../context/ToastContext";
import Menubar from "@thorium/ui/Menubar";
import {NavLink, useNavigate} from "react-router-dom";
import StationWrapper from "../components/Station";
import {ClientButton} from "../components/ClientButton";
import InfoTip from "@thorium/ui/InfoTip";

export default function FlightLobby() {
  const station = useNetRequest("station");
  const client = useNetRequest("client");

  if (station) return <StationWrapper />;

  if (client.isHost) return <HostLobby />;
  return <PlayerLobby />;
}

function PlayerLobby() {
  const flight = useNetRequest("flight");

  return (
    <>
      <Menubar />
      <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur">
        <ClientButton />

        <div className="flex-1 flex flex-col pt-16">
          {flight ? <PlayerStationSelection /> : <WaitingForFlight />}
        </div>
      </div>
    </>
  );
}

const flightDirectorStation = {
  name: "Flight Director",
  description: "Behind-the-scenes station for controlling the flight.",
};
function PlayerStationSelection() {
  const playerShips = useNetRequest("flightPlayerShips");

  return (
    <>
      <h1 className="text-center text-4xl font-bold mb-8">Choose a Station</h1>
      <div className="flex-1 flex justify-center gap-8">
        {playerShips.map(ship => (
          <div key={ship.id}>
            <h3 className="text-xl font-bold">
              {ship.components.identity?.name}
            </h3>
            <ul>
              {ship.components.stationComplement?.stations.map(station => (
                <PlayerStationItem
                  shipId={ship.id}
                  station={station}
                  key={station.name}
                />
              ))}
              {/* TODO April 23, 2022 - Hide this when the ship is configured to not have a flight director */}
              <PlayerStationItem
                shipId={ship.id}
                station={flightDirectorStation}
              />
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
  const clients = useNetRequest("clients");

  return (
    <>
      <li
        className="list-group-item"
        key={station.name}
        role="button"
        onClick={async () => {
          try {
            const result = await netSend("clientSetStation", {
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
  const navigate = useNavigate();
  const flight = useNetRequest("flight");
  const client = useNetRequest("client");

  return (
    <>
      <Menubar>
        {flight && (
          <>
            {client.isHost && (
              <Button
                className="btn btn-outline btn-xs btn-error"
                onClick={async () => {
                  await netSend("flightStop");
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
                  netSend("flightResume");
                }}
              >
                Resume
              </Button>
            ) : (
              <Button
                className="btn btn-outline btn-xs btn-warning"
                onClick={() => {
                  netSend("flightPause");
                }}
              >
                Pause
              </Button>
            )}
            <Button
              className="btn btn-outline btn-xs btn-notice"
              onClick={() => {
                netSend("flightReset");
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
        )}
      </Menubar>
      <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur flex flex-col">
        <ClientButton />
        <div className="flex-1 flex flex-col pt-16">
          {flight ? <ClientAssignment /> : <WaitingForFlight />}
        </div>
      </div>
    </>
  );
}

function ClientAssignment() {
  const clients = useNetRequest("clients");
  const client = useNetRequest("client");
  const playerShips = useNetRequest("flightPlayerShips");
  const [selectedClient, setSelectedClient] = useState(client.id);
  return (
    <div className="flex justify-around gap-4 w-full">
      <div>
        <h3 className="text-xl font-bold">Unassigned Clients</h3>
        <SearchableList
          showSearchLabel={false}
          selectedItem={selectedClient}
          setSelectedItem={setSelectedClient}
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
            <h3 className="text-xl font-bold">
              {ship.components.identity?.name}
            </h3>
            <ul>
              {ship.components.stationComplement?.stations.map(station => (
                <HostStationItem
                  shipId={ship.id}
                  station={station}
                  key={station.name}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                />
              ))}
              {/* TODO April 23, 2022 - Hide this when the ship is configured to not have a flight director */}
              <HostStationItem
                shipId={ship.id}
                station={flightDirectorStation}
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
              />
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
  const clients = useNetRequest("clients");

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
                const result = await netSend("clientSetStation", {
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
                  netSend("clientSetStation", {
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
