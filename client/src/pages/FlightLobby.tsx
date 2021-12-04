import {useClientData} from "../context/useCardData";
import {usePrompt} from "@thorium/ui/AlertDialog";
import {FaBan, FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";
import {useNetRequest} from "../context/useNetRequest";
import SearchableList from "../components/ui/SearchableList";
import {Dispatch, SetStateAction, useState} from "react";
import {toast} from "../context/ToastContext";
import Menubar from "@thorium/ui/Menubar";
import {useNavigate} from "react-router-dom";
import StationWrapper from "../components/Station";

export default function FlightLobby() {
  const clientData = useClientData();
  const navigate = useNavigate();

  if (clientData.station) {
    return <StationWrapper />;
  }
  return (
    <>
      <Menubar>
        {clientData.flight && (
          <>
            <Button
              className="btn btn-outline btn-xs btn-error"
              onClick={async () => {
                await netSend("flightStop");
                navigate("/");
              }}
            >
              End
            </Button>
            {clientData.flight?.paused ? (
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
              className="btn btn-outline btn-xs btn-alert"
              onClick={() => {
                netSend("flightReset");
              }}
            >
              Reset
            </Button>
          </>
        )}
      </Menubar>
      <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur">
        <ClientButton />

        <div className="h-full flex flex-col justify-center items-center space-y-8">
          {clientData.flight ? <ClientAssignment /> : <WaitingForFlight />}
        </div>
      </div>
    </>
  );
}

function ClientAssignment() {
  const playerShips = useNetRequest("flightPlayerShips");
  const clients = useNetRequest("clients");
  const clientData = useClientData();
  const [selectedClient, setSelectedClient] = useState(clientData.client.id);
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
                <StationItem
                  shipId={ship.id}
                  station={station}
                  key={station.name}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                />
              ))}
              <StationItem
                shipId={ship.id}
                station={{name: "Flight Director"}}
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

function StationItem({
  shipId,
  station,
  selectedClient,
  setSelectedClient,
}: {
  shipId: number;
  station: {name: string};
  selectedClient: string;
  setSelectedClient: Dispatch<SetStateAction<string>>;
}) {
  const clients = useNetRequest("clients");

  return (
    <>
      <li className="list-group-item" key={station.name}>
        <span className="flex justify-between gap-2">
          <span>{station.name}</span>{" "}
          <Button
            className={`btn-xs btn-success ${
              !selectedClient ? "btn-disabled" : ""
            }`}
            onClick={async () => {
              const result = await netSend("clientSetStation", {
                shipId: shipId,
                stationId: station.name,
                clientId: selectedClient,
              });
              if ("error" in result) {
                toast({
                  title: "Error assigning station",
                  body: result.error,
                  color: "error",
                });
              }
            }}
          >
            Assign
          </Button>
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
      <h1 className="text-6xl text-white font-bold">
        Waiting for Flight to Start...
      </h1>
      <FaSpinner className="animate-spin-step text-4xl text-white" />
    </>
  );
}

function ClientButton() {
  const clientData = useClientData();
  const prompt = usePrompt();
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-white font-bold">Client Name:</h2>
      <Button
        className="btn-primary btn-sm"
        onClick={async () => {
          const name = await prompt({
            header: "What is the new client name?",
          });
          if (typeof name === "string") {
            const result = await netSend("clientSetName", {name});
          }
        }}
      >
        {clientData?.client.name || ""}
      </Button>
    </div>
  );
}
