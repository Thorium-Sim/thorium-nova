import { q } from "@thorium/context/AppContext";
import CardProvider from "@thorium/context/CardContext";
import * as Cores from "@thorium/cores";
import { StationData } from "@thorium/routes/station/useStation";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { Suspense } from "react";

import type { Route } from "./+types/Preview";

export default function TestCoreComponent({ params }: Route.ComponentProps) {
	const Comp = Cores[params.component as keyof typeof Cores];
	const [player] = q.ship.players.useNetRequest();
	if (!Comp)
		return (
			<div>
				<p>Core {params.component} not found. Options include:</p>
				<ul className="ml-4 list-disc">
					{Object.keys(Cores).map((c) => (
						<li key={c}>{c}</li>
					))}
				</ul>
			</div>
		);

	return (
		<StationData shipId={player[0]?.id}>
			<CardProvider cardName={params.component} cardLoaded isWidget={false}>
				<div className="h-full w-full bg-gray-800 p-16">
					<Suspense fallback={<LoadingSpinner compact />}>
						<Comp />
					</Suspense>
				</div>
			</CardProvider>
		</StationData>
	);
}
