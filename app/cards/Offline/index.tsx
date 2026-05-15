import { clientId, q } from "@thorium/context/AppContext";
import { Fragment } from "react";

// Messages go here
/*
const messages: Record<string, { title: string; message: string }> = {
	blackout: { title: "blackout", message: "" },
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
*/
const Offline: React.FC = () => {
	const [client] = q.client.get.useNetRequest({ clientId });

	if (!client.offlineState) return null;
	return (
		<div className="card-offline">
			{client.offlineState.title === "blackout" ? (
				<div className="blackout-back fixed top-0 z-50 h-full w-full" />
			) : (
				<Fragment>
					<p className="offline-title">{client.offlineState.title}</p>
					<p className="offline-message">{client.offlineState.message}</p>
				</Fragment>
			)}
		</div>
	);
};

export default Offline;
