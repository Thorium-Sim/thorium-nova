import {useSystemShipsStore} from "client/components/viewscreen/useSystemShips";
import {useWaypointsSubscription} from "client/generated/graphql";
import {useFrame} from "react-three-fiber";
import {Euler, Matrix4, Quaternion, Vector3} from "three";
import create from "zustand";
import {getWaypointRelativePosition} from "./getWaypointRelativePosition";

interface PilotStoreI extends Record<string | number | symbol, unknown> {
  facingWaypoints: string[];
}
export const pilotStore = create<PilotStoreI>(set => ({
  facingWaypoints: [],
}));

type WaypointType = NonNullable<
  ReturnType<typeof useWaypointsSubscription>["data"]
>["playerShipWaypoints"][0];

window.Quaternion = Quaternion;
window.Vector3 = Vector3;
const waypointPosition = new Vector3();
const shipPosition = new Vector3();
let up = new Vector3(0, 1, 0);
let matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
let rotationQuat = new Quaternion();
let desiredRotationQuat = new Quaternion();

const getYawPitchRoll = (quat: Quaternion) => {
  const yaw =
    Math.atan2(
      2 * quat.y * quat.w - 2 * quat.x * quat.z,
      1 - 2 * quat.y * quat.y - 2 * quat.z * quat.z
    ) + 0;
  const pitch =
    Math.atan2(
      2 * quat.x * quat.w - 2 * quat.y * quat.z,
      1 - 2 * quat.x * quat.x - 2 * quat.z * quat.z
    ) + 0;
  const roll = Math.asin(2 * quat.x * quat.y + 2 * quat.z * quat.w) + 0;
  return [yaw, pitch, roll];
};

export function useGetFacingWaypoint({
  waypoints = [],
  playerId,
}: {
  waypoints: WaypointType[] | undefined;
  playerId: string;
}) {
  // This needs some work
  useFrame(() => {
    const playerShip = useSystemShipsStore.getState()[playerId];
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
      desiredRotationQuat.setFromRotationMatrix(matrix).normalize();
      const angle = Math.abs(rotationQuat.angleTo(desiredRotationQuat));
      if (angle < Math.PI / 60) {
        facingWaypoints.push(waypoint.id);
      }
    }
    pilotStore.setState({facingWaypoints});
  });
}
