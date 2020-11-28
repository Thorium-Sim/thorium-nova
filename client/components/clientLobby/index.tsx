import {Button} from "@chakra-ui/core";
import {css} from "@emotion/core";
import {
  useClientAssignShipMutation,
  useClientsSubscription,
  useFlightSubscription,
} from "client/generated/graphql";
import {useClientId} from "client/helpers/getClientId";
import {Fragment} from "react";
import {useTranslation} from "react-i18next";
import ListGroupItem from "../ui/ListGroupItem";
import {ClientButton} from "./ClientButton";

export const ClientLobby = () => {
  const {data, loading} = useFlightSubscription();
  const {data: clientData} = useClientsSubscription();
  const {t} = useTranslation();
  return (
    <div className="p-8 py-12 h-full flex flex-col bg-blackAlpha-500">
      <div className="flex">
        <h2 className="font-bold text-4xl mr-4">{t("Client Lobby")}</h2>
        <ClientButton />
      </div>
      <div className="flex justify-around items-center mt-4 flex-1 gap-4 overflow-y-hidden">
        {!loading && !data?.flight ? (
          <div className="text-center">
            <h3 className="font-bold text-6xl mb-4">
              {t("Connected to Server")}
            </h3>
            <h4 className="font-bold text-5xl mb-12">
              {t("Standby for Flight Assignment")}
            </h4>
          </div>
        ) : (
          data?.flight?.playerShips.map(p => (
            <div
              key={p.id}
              className="flex flex-1 flex-col h-full"
              css={css`
                max-width: 20rem;
                margin: 0 auto;
              `}
            >
              <h3 className="font-bold text-2xl">{p.identity.name}</h3>
              <StationList clientData={clientData} p={p} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StationList: React.FC<{
  p: NonNullable<
    NonNullable<ReturnType<typeof useFlightSubscription>["data"]>["flight"]
  >["playerShips"][0];
  clientData: ReturnType<typeof useClientsSubscription>["data"];
}> = ({p, clientData}) => {
  const [assignShip] = useClientAssignShipMutation();
  const {t} = useTranslation();
  const [clientId] = useClientId();

  return (
    <div className="flex-1 overflow-y-auto">
      {p.stationComplement.stations.map(station => (
        <Fragment key={station.id}>
          <ListGroupItem
            onClick={() => {
              assignShip({
                variables: {
                  clientId,
                  shipId: p.id,
                  stationId: station.id,
                },
              });
            }}
          >
            <strong className="text-xl">{station.name}</strong>
            <ul className="pl-4">
              {clientData?.clients
                .filter(c => c.shipId === p.id && c.stationId === station.id)
                .map(c => (
                  <li key={c.id}>{c.name}</li>
                ))}
            </ul>
          </ListGroupItem>
        </Fragment>
      ))}
    </div>
  );
};
