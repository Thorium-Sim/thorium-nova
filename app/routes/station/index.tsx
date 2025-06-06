import Effects, { useEscapeHotkey } from "./Effects";
import { Outlet } from "react-router";
import { SoundPlayer } from "@thorium/utils/sounds/playSound";
import StationLayout from "@thorium/components/Station/StationLayout";
import { StationData, useStation } from "@thorium/routes/station/useStation";
import { Suspense, type ReactNode } from "react";

export default function StationWrapper() {
	useEscapeHotkey();
	// TODO November 29, 2021: Include some kind of alert toast notification thing here
	// The existing alerts won't be targeted by the theme, so we need to embed it here.
	return (
		<div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
			<Suspense>
				<StationData>
					<Blackout>
						<Effects />
						<SoundPlayer />
						<StationLayout />
						<Outlet />
					</Blackout>
				</StationData>
			</Suspense>
		</div>
	);
}

function Blackout({ children }: { children: ReactNode }) {
	const { station, client } = useStation();
	if (station && client && client.offlineState?.title !== "blackout")
		return children;
	return null;
}

export function ErrorBoundary() {
	return <div>There has been an error.</div>;
}
