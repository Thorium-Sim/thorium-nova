import type { CardProps } from "@thorium/cards/CardProps";
import { CircleGrid, GridCanvas } from "@thorium/cards/Pilot/CircleGrid";
import { CircleGridContacts } from "@thorium/cards/Pilot/PilotContacts";
import { CircleGridStoreProvider } from "@thorium/cards/Pilot/useCircleGridStore";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { q } from "@thorium/context/AppContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { Suspense, useRef } from "react";

export function Sensors({ cardLoaded }: CardProps) {
	const [{ activeRange, passiveRange }] = q.sensors.get.useNetRequest();

	return (
		<CircleGridStoreProvider zoomMax={passiveRange}>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				<Suspense>
					<SensorsShipList />
				</Suspense>
				<div className="col-span-2 w-full aspect-square self-center">
					<Suspense fallback={null}>
						<GridCanvas
							shouldRender={cardLoaded}
							// onBackgroundClick={() => {
							//   if (clickRef.current === true) {
							//     clickRef.current = false;
							//     return;
							//   }
							//   if (targetedContact) {
							//     setTarget.mutate({ target: null });
							//   }
							// }}
						>
							<CircleGrid>
								<CircleGridContacts
								// onContactClick={(contact) => {
								//   clickRef.current = true;
								//   setTarget.mutate({ target: contact });
								// }}
								/>
							</CircleGrid>
						</GridCanvas>
					</Suspense>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

function SensorsShipList() {
	const [{ id: playerShipId }] = q.ship.player.useNetRequest();
	q.sensors.stream.useDataStream({ systemId: null });

	const [ships] = q.sensors.ships.useNetRequest();
	return (
		<div className="flex flex-col justify-between">
			<ul>
				{ships.map((ship) =>
					playerShipId !== ship.id ? (
						<SensorsShip {...ship} key={ship.id} />
					) : null,
				)}
			</ul>
		</div>
	);
}

function SensorsShip({ id }: { id: number }) {
	const [{ id: playerShipId, currentSystem }] = q.ship.player.useNetRequest();
	const distanceRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const position = interpolate(id);
		const shipPosition = interpolate(playerShipId);
		if (position && shipPosition && distanceRef.current) {
			const distance = Math.hypot(
				shipPosition.x - position.x,
				shipPosition.y - position.y,
				shipPosition.z - position.z,
			);
			const units = currentSystem ? "km" : "LY";
			distanceRef.current.innerHTML = `${Math.round(distance).toLocaleString("en")} ${units}`;
		}
	});
	return (
		<li className="list-group-item list-group-item-small" key={id}>
			<div className="flex justify-between">
				Unknown ship
				<span ref={distanceRef} />
			</div>
		</li>
	);
}
