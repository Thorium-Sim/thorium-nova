import Stars from "@thorium/components/Station/Stars";
import StationLayout from "@thorium/components/Station/StationLayout";
import { StationData, useStation } from "@thorium/routes/station/useStation";
import { SoundPlayer } from "@thorium/utils/sounds/playSound";
import { Suspense, type ReactNode } from "react";
import { Outlet } from "react-router";

import Effects, { useEscapeHotkey } from "./Effects";

export default function StationWrapper() {
	useEscapeHotkey();
	// TODO November 29, 2021: Include some kind of alert toast notification thing here
	// The existing alerts won't be targeted by the theme, so we need to embed it here.
	return (
		<div className="bottom- absolute top-0 z-1 h-full w-full bg-black">
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
	if (!station) {
		return (
			<Stars className="bg-gradient-to-b from-black to-slate-950">
				<h1 className="text-4xl font-bold">Awaiting Station Assignment...</h1>
			</Stars>
		);
	}
	if (client?.offlineState?.title !== "blackout") return children;
	return null;
}

export function ErrorBoundary() {
	return <div className="fixed inset-0 bg-black" />;
}
