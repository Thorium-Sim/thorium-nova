import { clientId, q } from "@thorium/context/AppContext";
import { useFrame } from "@react-three/fiber";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { Matrix4, Quaternion, Vector3 } from "three";
import { create } from "zustand";
import { getWaypointRelativePosition } from "./getWaypointRelativePosition";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";
import { useStation } from "@thorium/routes/station/useStation";
import throttle from "lodash.throttle";

function createCircleGridStore({
	zoomMin = 0.01,
	zoomMax = 10000,
}: {
	zoomMin?: number;
	zoomMax?: number;
}) {
	return create<{
		zoom: number;
		zoomMin: number;
		zoomMax: number;
		tilt: number;
		width: number;
		height: number;
		facingWaypoints: number[];
	}>((set) => ({
		zoom: 100,
		zoomMin,
		zoomMax,
		tilt: 0,
		width: 0,
		height: 0,
		facingWaypoints: [],
	}));
}

export const CircleGirdStoreContext = createContext<ReturnType<
	typeof createCircleGridStore
> | null>(null);

export function CircleGridStoreProvider({
	zoomMin = 0.01,
	zoomMax = 10000,
	children,
}: {
	zoomMin?: number;
	zoomMax?: number;
	children: ReactNode;
}) {
	const [useCircleGridStore] = useState(() =>
		createCircleGridStore({ zoomMin, zoomMax }),
	);
	return (
		<CircleGirdStoreContext.Provider value={useCircleGridStore}>
			{children}
		</CircleGirdStoreContext.Provider>
	);
}

export function useCircleGridStore() {
	const store = useContext(CircleGirdStoreContext);
	if (!store) {
		throw new Error(
			"useCircleGridStore must be used within a CircleGridStoreProvider",
		);
	}
	return store;
}

const waypointPosition = new Vector3();
const shipPosition = new Vector3();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();

export function useGetFacingWaypoint() {
	const store = useCircleGridStore();
	const { interpolate } = useLiveQuery();
	const { id, currentSystem, systemPosition } = useStation().ship;

	const [waypoints] = q.waypoints.all.useNetRequest({
		systemId: "all",
		active: true,
		shipId: id,
	});

	const sendFacingWaypoint = useCallback(
		throttle((waypointId) => {
			q.thorium.genericEvent.netSend({
				clientId,
				eventName: "facing-waypoint",
				properties: `${waypointId}`,
			});
		}, 1000),
		[],
	);

	// TODO January 7, 2026 - This needs some work, mostly with dynamically updating the waypoint's appearance without triggering a state update
	useFrame(() => {
		const playerShip = interpolate(id);
		if (!playerShip) return;
		const rotation = playerShip.r;
		if (!rotation) return;
		shipPosition.set(playerShip.x, playerShip.y, playerShip.z);
		const facingWaypoints = [];
		for (const waypoint of waypoints) {
			rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
			getWaypointRelativePosition(
				waypoint.position,
				waypoint.position.parentId,
				waypoint.systemPosition,
				systemPosition,
				currentSystem,
				waypointPosition,
			);
			up.set(0, 1, 0).applyQuaternion(rotationQuat);
			matrix
				.lookAt(shipPosition, waypointPosition, up)
				.multiply(rotationMatrix);
			desiredRotationQuat.setFromRotationMatrix(matrix);
			const angle = Math.abs(rotationQuat.angleTo(desiredRotationQuat));
			// 3 Degrees of difference
			if (angle < Math.PI / 60) {
				facingWaypoints.push(waypoint.id);
			}
			if (store.getState().facingWaypoints.includes(waypoint.id)) {
				// We're facing a new waypoint, so we can trigger this event
				sendFacingWaypoint(waypoint.id);
			}
		}
		store.setState({ facingWaypoints });
	});
}
