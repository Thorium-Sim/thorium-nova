import {useInterstellarShipsStore} from "client/components/viewscreen/useInterstellarShips";
import {useSystemShipsStore} from "client/components/viewscreen/useSystemShips";
import {useWaypointsSubscription} from "client/generated/graphql";
import {useFrame} from "react-three-fiber";
import {Matrix4, Quaternion, Vector3} from "three";
import create from "zustand";
import {getWaypointRelativePosition} from "./getWaypointRelativePosition";

interface PilotStoreI extends Record<string | number | symbol, unknown> {
  facingWaypoints: string[];
}
export const usePilotStore = create<PilotStoreI>(set => ({
  facingWaypoints: [],
}));

type WaypointType = NonNullable<
  ReturnType<typeof useWaypointsSubscription>["data"]
>["playerShipWaypoints"][0];

const waypointPosition = new Vector3();
const shipPosition = new Vector3();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
let rotationQuat = new Quaternion();
let desiredRotationQuat = new Quaternion();

export function useGetFacingWaypoint({
  waypoints = [],
  playerId,
}: {
  waypoints: WaypointType[] | undefined;
  playerId: string;
}) {
  // This needs some work
  useFrame(() => {
    const playerShip =
      useSystemShipsStore.getState()[playerId] ||
      useInterstellarShipsStore.getState()[playerId];
    if (!playerShip) return;
    const rotation = playerShip.rotation;
    const position = playerShip.position;
    if (!rotation || !position) return;
    shipPosition.set(position.x, position.y, position.z);
    let facingWaypoints = [];
    for (let waypoint of waypoints) {
      rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
      getWaypointRelativePosition(waypoint, playerShip, waypointPosition);
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
    }
    usePilotStore.setState({facingWaypoints});
  });
}
