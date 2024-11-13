import { q } from "@client/context/AppContext";

import StationLayout from "./StationLayout";
import Effects from "./Effects";
import { SoundPlayer } from "@client/utils/sounds/playSound";

export default function StationWrapper() {
	const [client] = q.client.get.useNetRequest();
	const [station] = q.station.get.useNetRequest();
	// TODO November 29, 2021: Include some kind of alert toast notification thing here
	// The existing alerts won't be targeted by the theme, so we need to embed it here.
	return (
		<div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
			{station && client && client.offlineState !== "blackout" && (
				<>
					<Effects />
					<SoundPlayer />
					<StationLayout />
				</>
			)}
		</div>
	);
}

export function ErrorBoundary() {
	return <div>There has been an error.</div>;
}
