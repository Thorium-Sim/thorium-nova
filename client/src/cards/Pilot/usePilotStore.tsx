import {q} from "@client/context/AppContext";
import {useFrame} from "@react-three/fiber";
import {useLiveQuery} from "@thorium/live-query/client";
import {Matrix4, Quaternion, Vector3} from "three";
import create from "zustand";
import {getWaypointRelativePosition} from "./getWaypointRelativePosition";

export const usePilotStore = create<{
  zoom: number;
  tilt: number;
  width: number;
  height: number;
  facingWaypoints: number[];
}>(set => ({
  zoom: 100,
  tilt: 0,
  width: 0,
  height: 0,
  facingWaypoints: [],
}));

const waypointPosition = new Vector3();
const shipPosition = new Vector3();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
let rotationQuat = new Quaternion();
let desiredRotationQuat = new Quaternion();

export function useGetFacingWaypoint() {
  const {interpolate} = useLiveQuery();
  const [{id, currentSystem, systemPosition}] = q.ship.player.useNetRequest();
  const [waypoints] = q.waypoints.all.useNetRequest({systemId: "all"});
  // This needs some work
  useFrame(() => {
    const playerShip = interpolate(id);
    if (!playerShip) return;
    const rotation = playerShip.r;
    if (!rotation) return;
    shipPosition.set(playerShip.x, playerShip.y, playerShip.z);
    let facingWaypoints = [];
    for (let waypoint of waypoints) {
      rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
      getWaypointRelativePosition(
        waypoint.position,
        waypoint.position.parentId,
        waypoint.systemPosition,
        systemPosition,
        currentSystem,
        waypointPosition
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
    }
    usePilotStore.setState({facingWaypoints});
  });
}
