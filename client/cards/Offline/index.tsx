import {useClientData} from "client/components/clientLobby/ClientContext";
import {Fragment} from "react";

const Offline: React.FC = () => {
  const {client} = useClientData();
  // Messages go here
  const messages: Record<string, {title: string; message: string}> = {
    blackout: {title: "", message: ""},
    offline: {
      title: "Station Offline",
      message:
        "This station is offline. This may be due to power loss or station damage.",
    },
    power: {
      title: "Power Loss",
      message: "This station has insufficient power to operate.",
    },
    lockdown: {
      title: "Lockdown",
      message:
        "This station has been locked down by the central computer. No access permitted.",
    },
    maintenance: {
      title: "Maintenance",
      message:
        "This station is down for maintenance. Please contact your system administrator for more information.",
    },
  };
  if (!client.offlineState) return null;
  const message = messages[client.offlineState] || {};
  return (
    <div className="card-offline">
      {client.offlineState === "blackout" ? (
        <div className="blackout-back fixed z-50 top-0 w-full h-full" />
      ) : (
        <Fragment>
          <p className="offline-title">{message.title}</p>
          <p className="offline-message">{message.message}</p>
        </Fragment>
      )}
    </div>
  );
};

export default Offline;
