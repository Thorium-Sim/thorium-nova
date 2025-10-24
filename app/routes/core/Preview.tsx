import { Suspense } from "react";
import type { Route } from "./+types/Preview";
import * as Cores from "@thorium/cores";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import CardProvider from "@thorium/context/CardContext";
import { StationData } from "@thorium/routes/station/useStation";
import { q } from "@thorium/context/AppContext";

export default function TestCoreComponent({ params }: Route.ComponentProps) {
	const Comp = Cores[params.component as keyof typeof Cores];
	const [player] = q.ship.players.useNetRequest();
	if (!Comp)
		return (
			<div>
				<p>Core {params.component} not found. Options include:</p>
				<ul className="list-disc ml-4">
					{Object.keys(Cores).map((c) => (
						<li key={c}>{c}</li>
					))}
				</ul>
			</div>
		);

	return (
		<StationData shipId={player[0]?.id}>
			<CardProvider cardName={params.component} cardLoaded isWidget={false}>
				<div className="bg-gray-800 w-full h-full p-16">
					<Suspense fallback={<LoadingSpinner compact />}>
						<Comp />
					</Suspense>
				</div>
			</CardProvider>
		</StationData>
	);
}
