import { q } from "@thorium/context/AppContext";

import Effects, { useEscapeHotkey } from "./Effects";
import { Outlet } from "react-router";
import { SoundPlayer } from "@thorium/utils/sounds/playSound";
import StationLayout from "@thorium/components/Station/StationLayout";

export default function StationWrapper() {
	const [client, q1] = q.client.get.useNetRequest();
	const [station, q2] = q.station.get.useNetRequest();
	useEscapeHotkey();
	// TODO November 29, 2021: Include some kind of alert toast notification thing here
	// The existing alerts won't be targeted by the theme, so we need to embed it here.
	return (
		<div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
			{station && client && client.offlineState !== "blackout" && (
				<>
					<Effects />
					<SoundPlayer />
					<StationLayout />
					<Outlet />
				</>
			)}
		</div>
	);
}

export function ErrorBoundary() {
	return <div>There has been an error.</div>;
}
