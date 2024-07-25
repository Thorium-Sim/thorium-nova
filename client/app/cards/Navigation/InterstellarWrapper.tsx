import { useGetStarmapStore } from "@client/components/Starmap/starmapStore";
import { InterstellarMap } from "@client/components/Starmap/InterstellarMap";
import SystemMarker from "@client/components/Starmap/SystemMarker";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { StarmapShip } from "@client/components/Starmap/StarmapShip";
import { WaypointEntity } from "@client/components/Starmap/WaypointEntity";
import { q } from "@client/context/AppContext";

export function InterstellarWrapper() {
	const useStarmapStore = useGetStarmapStore();
	// This netRequest comes from the starmap core.
	const [starmapSystems] = q.starmapCore.systems.useNetRequest();
	const [ship] = q.navigation.ship.useNetRequest();

	const [waypoints] = q.waypoints.all.useNetRequest({ systemId: null });
	useEffect(() => {
		useStarmapStore.getState().currentSystemSet?.(null);
	}, [useStarmapStore]);

	return (
		<InterstellarMap>
			{starmapSystems.map((sys) =>
				sys.components.position && sys.components.identity ? (
					<SystemMarker
						key={sys.id}
						systemId={sys.id}
						position={
							[
								sys.components.position.x,
								sys.components.position.y,
								sys.components.position.z,
							] as [number, number, number]
						}
						name={sys.components.identity.name}
						onClick={() =>
							useStarmapStore.setState({ selectedObjectIds: [sys.id] })
						}
						onDoubleClick={() =>
							useStarmapStore.getState().setCurrentSystem(sys.id)
						}
					/>
				) : null,
			)}
			{ship.position?.parentId === null && (
				<Suspense key={ship.id} fallback={null}>
					<ErrorBoundary
						FallbackComponent={() => <></>}
						onError={(err) => console.error(err)}
					>
						<StarmapShip id={ship.id} size={ship.size} logoUrl={ship.icon} />
					</ErrorBoundary>
				</Suspense>
			)}
			{waypoints.map((waypoint) => (
				<Suspense key={waypoint.id}>
					<ErrorBoundary
						FallbackComponent={() => <></>}
						onError={(err) => console.error(err)}
					>
						<WaypointEntity position={waypoint.position} />
					</ErrorBoundary>
				</Suspense>
			))}
		</InterstellarMap>
	);
}
