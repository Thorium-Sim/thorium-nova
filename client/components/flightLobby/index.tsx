import {css} from "@emotion/core";
import {
  useFlightSubscription,
  useFlightStopMutation,
  useFlightPauseMutation,
  useFlightResumeMutation,
  useFlightResetMutation,
  useClientsSubscription,
  useClientAssignShipMutation,
  ActiveFlightDocument,
} from "client/generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {useConfirm} from "../Dialog";
import Button from "../ui/button";
import SearchableList from "../ui/SearchableList";
import ListGroupItem from "../ui/ListGroupItem";
import {FaBan} from "react-icons/fa";
import {useClientId} from "client/helpers/getClientId";
import {NavLink} from "react-router-dom";

const FlightMenubar: React.FC<{paused: boolean}> = ({paused}) => {
  const {t} = useTranslation();
  const [end] = useFlightStopMutation({
    refetchQueries: [{query: ActiveFlightDocument}],
  });
  const [pause] = useFlightPauseMutation();
  const [resume] = useFlightResumeMutation();
  const [reset] = useFlightResetMutation();

  const confirm = useConfirm();
  const navigate = useNavigate();

  return (
    <div
      className="absolute top-0 left-0 w-screen p-2 pointer-events-none"
      css={css`
        * {
          pointer-events: all;
        }
      `}
    >
      <div className="flex gap-2 pointer-events-none">
        <Button
          variant="ghost"
          variantColor="danger"
          size="sm"
          onClick={async () => {
            if (
              await confirm({
                header: t("Are you sure you want to end this flight?"),
                body: t(
                  "The state of this flight will be stored and can be accessed later."
                ),
              })
            ) {
              await end();

              navigate("/");
            }
          }}
        >
          {t("End")}
        </Button>
        {paused ? (
          <Button
            variant="ghost"
            variantColor="success"
            size="sm"
            onClick={() => resume()}
          >
            {t("Resume")}
          </Button>
        ) : (
          <Button
            variant="ghost"
            variantColor="warning"
            size="sm"
            onClick={() => pause()}
          >
            {t("Pause")}
          </Button>
        )}
        <Button
          variant="ghost"
          variantColor="info"
          size="sm"
          onClick={async () => {
            if (
              await confirm({
                header: t("Are you sure you want to reset this flight?"),
                body: t(
                  "This flight will revert to the point right after it was created."
                ),
              })
            ) {
              reset();
            }
          }}
        >
          {t("Reset")}
        </Button>
      </div>
    </div>
  );
};
const FlightLobby = () => {
  const {data, loading} = useFlightSubscription();
  const {data: clientData} = useClientsSubscription();

  const navigate = useNavigate();

  const [selectedClient, setSelectedClient] = React.useState<string | null>(
    null
  );

  const [clientId] = useClientId();
  const myClient = clientData?.clients.find(c => c.id === clientId);

  React.useEffect(() => {
    if (!data?.flight && !loading) {
      navigate("/");
    }
  }, [data?.flight, loading, navigate]);

  // TODO: Add a menubar with features only available to the game host.
  // Things like pause/unpause, stop flight, and reset flight
  const {t} = useTranslation();
  return (
    <div className="p-8 py-12 h-full flex flex-col bg-blackAlpha-500">
      <FlightMenubar paused={data?.flight?.paused || true} />
      <div className="flex justify-between">
        <h2 className="font-bold text-4xl">{t("Flight Lobby")}</h2>
        <Button
          size="lg"
          variantColor="success"
          disabled={!myClient?.stationId}
          as={NavLink}
          to="/flight/station"
        >
          {t("Go to Station")}
        </Button>
      </div>
      <div className="flex mt-4 flex-1 gap-4 overflow-y-hidden">
        <div className="flex-1">
          <h3 className="font-bold text-2xl">{t("Unassigned Clients")}</h3>
          <SearchableList
            items={
              clientData?.clients
                .filter(c => !c.shipId && !c.stationId)
                .map(c => ({
                  id: c.id,
                  label: `${c.name} ${c.id === clientId ? "(Me)" : ""}`,
                })) || []
            }
            selectedItem={selectedClient}
            setSelectedItem={item => setSelectedClient(item)}
          />
        </div>
        <div
          className="flex"
          css={css`
            flex: 3;
          `}
        >
          {data?.flight?.playerShips.map(p => (
            <div
              key={p.id}
              className="flex flex-1 flex-col h-full"
              css={css`
                max-width: 20rem;
                margin: 0 auto;
              `}
            >
              <h3 className="font-bold text-2xl">{p.identity.name}</h3>
              <StationList
                clientData={clientData}
                p={p}
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StationList: React.FC<{
  p: NonNullable<
    NonNullable<ReturnType<typeof useFlightSubscription>["data"]>["flight"]
  >["playerShips"][0];
  selectedClient: string | null;
  setSelectedClient: React.Dispatch<React.SetStateAction<string | null>>;
  clientData: ReturnType<typeof useClientsSubscription>["data"];
}> = ({p, selectedClient, setSelectedClient, clientData}) => {
  const [assignShip] = useClientAssignShipMutation();
  const {t} = useTranslation();
  const [clientId] = useClientId();

  return (
    <div className="flex-1 overflow-y-auto">
      {p.stationComplement.stations.map(station => (
        <React.Fragment key={station.id}>
          <ListGroupItem
            className="flex justify-between"
            onClick={() => {
              selectedClient &&
                assignShip({
                  variables: {
                    clientId: selectedClient,
                    shipId: p.id,
                    stationId: station.id,
                  },
                });
            }}
          >
            <strong className="text-xl">{station.name}</strong>
            <Button size="sm" variant="ghost" disabled={!selectedClient}>
              {t("Assign Client")}
            </Button>
          </ListGroupItem>
          {clientData?.clients
            .filter(c => c.shipId === p.id && c.stationId === station.id)
            .map(c => (
              <ListGroupItem
                key={c.id}
                className="pl-4 flex items-center justify-between"
                selected={selectedClient === c.id}
                onClick={() => setSelectedClient(c.id)}
              >
                {c.name}
                {clientId === c.id ? " (Me)" : ""}
                <FaBan
                  className="text-red-500"
                  onClick={() => {
                    assignShip({
                      variables: {
                        clientId: c.id,
                        shipId: null,
                        stationId: null,
                      },
                    });
                  }}
                />
              </ListGroupItem>
            ))}
        </React.Fragment>
      ))}
    </div>
  );
};
export default FlightLobby;
