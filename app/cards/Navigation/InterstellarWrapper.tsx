import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { StarmapShip } from "@thorium/components/Starmap/StarmapShip";
import { WaypointEntity } from "@thorium/components/Starmap/WaypointEntity";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";

export function InterstellarWrapper() {
	const { shipId } = useStation();
	const useStarmapStore = useGetStarmapStore();
	// This netRequest comes from the starmap core.
	const [starmapSystems] = q.starmapCore.systems.useNetRequest();
	const [ship] = q.navigation.ship.useNetRequest({ shipId });

	const [waypoints] = q.waypoints.all.useNetRequest({
		systemId: null,
		active: false,
		shipId,
	});
	useEffect(() => {
		useStarmapStore.getState().currentSystemSet?.(null);
	}, [useStarmapStore]);

	return (
		<InterstellarMap>
			{starmapSystems.map((sys) =>
				sys.position && sys.identity ? (
					<SystemMarker
						key={sys.id}
						systemId={sys.id}
						position={
							[sys.position.x, sys.position.y, sys.position.z] as [
								number,
								number,
								number,
							]
						}
						name={sys.identity.name}
						onClick={() =>
							useStarmapStore.setState({ selectedObjectIds: [sys.id] })
						}
						onDoubleClick={() => {
							useStarmapStore.getState().setCurrentSystem(sys.id);
							useStarmapStore.setState({ selectedObjectIds: [] });
						}}
						commSatelliteRadius={null}
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
