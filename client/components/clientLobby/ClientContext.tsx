import {
  ClientStationSubscription,
  useClientStationSubscription,
} from "client/generated/graphql";
import {createContext, FC, useContext, useMemo} from "react";
import {ClientLobby} from ".";
import StationViewer from "../station";

interface ClientContextI {
  client: ClientStationSubscription["client"];
  ship: NonNullable<ClientStationSubscription["client"]["ship"]>;
  station: NonNullable<ClientStationSubscription["client"]["station"]>;
}
const ClientContext = createContext<ClientContextI>({} as ClientContextI);

const ClientContextProvider: FC = () => {
  const {data, loading} = useClientStationSubscription();
  const client = data?.client;
  const station = client?.station;
  const ship = client?.ship;
  const value = useMemo(() => {
    if (!client || !station || !ship) return null;
    return {
      client,
      station,
      ship,
    };
  }, [client, station, ship]);
  if (loading) return null;
  if (value)
    return (
      <ClientContext.Provider value={value}>
        <StationViewer />
      </ClientContext.Provider>
    );
  return <ClientLobby />;
};

export const SampleClientContextProvider: FC = ({children}) => {
  const station = {
    id: "Test Station",
    name: "Command",
    layout: "",
    logo: "",
    cards: [
      {
        id: "Card 1",
        name: "Short",
        component: "Login",
        icon: null,
      },
      {
        id: "Card 2",
        name: "Exceptionally Long Card Name",
        component: "Login",
        icon: null,
      },
    ],
  };
  const ship = {
    id: "Test Ship",
    identity: {name: "USS Testing"},
    shipAssets: {
      logo: "/logo.svg",
      model: "",
      side: "",
      top: "",
      vanity: "",
    },
  };
  return (
    <ClientContext.Provider
      value={{
        client: {
          id: "Testing",
          loginName: "Test Testerson",
          offlineState: "online",
          training: false,
          ship,
          station,
        },
        ship,
        station,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export default ClientContextProvider;

export const useClientData = () => {
  const data = useContext(ClientContext);
  return data;
};
