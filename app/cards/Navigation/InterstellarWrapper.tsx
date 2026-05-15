import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import { StarmapShip } from "@thorium/components/Starmap/StarmapShip";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { WaypointEntity } from "@thorium/components/Starmap/WaypointEntity";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

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
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });
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
						position={[sys.position.x, sys.position.y, sys.position.z]}
						name={sys.identity.name}
						onClick={() => {
							useStarmapStore.setState({ selectedObjectIds: [sys.id] });
						}}
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
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<StarmapShip id={ship.id} size={ship.size} logoUrl={ship.icon} />
					</ErrorBoundary>
				</Suspense>
			)}
			{waypoints.map((waypoint) => (
				<Suspense key={waypoint.id}>
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<WaypointEntity
							position={waypoint.position}
							isActive={waypoint.isActive}
							isFacing={waypoint.id === autopilot.facingWaypointIds[0]}
							isLocked={waypoint.id === autopilot.destinationWaypointId}
						/>
					</ErrorBoundary>
				</Suspense>
			))}
		</InterstellarMap>
	);
}
