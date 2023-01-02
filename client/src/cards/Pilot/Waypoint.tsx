import {q} from "@client/context/AppContext";
import {useTexture} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import type {AppRouter} from "@server/init/router";
import {useLiveQuery} from "@thorium/live-query/client";
import type {inferTransformedProcedureOutput} from "@thorium/live-query/server/types";
import {useRef} from "react";
import {
  Camera,
  Frustum,
  Group,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Sprite,
  Vector3,
} from "three";
import {DEG2RAD} from "three/src/math/MathUtils";
import WaypointTexture from "../../components/Starmap/Waypoint.svg";
import StrokeTexture from "../../components/Starmap/WaypointStroke.svg";
import {getWaypointRelativePosition} from "./getWaypointRelativePosition";
import {usePilotStore} from "./usePilotStore";

type WaypointItem = inferTransformedProcedureOutput<
  AppRouter["waypoints"]["all"]
>[0];

const playerVector = new Vector3();
const waypointVector = new Vector3();
const frustum = new Frustum();
const matrix = new Matrix4();
const sizeVector = new Vector3();
const targetPosition = new Vector3();
const cameraPosition = new Vector3();

const LY_IN_KM = 9460730472580.8;

export const WaypointEntity = ({
  waypoint,
  viewscreen,
}: {
  waypoint: WaypointItem;
  viewscreen?: boolean;
}) => {
  const spriteMap = useTexture(WaypointTexture);
  const strokeMap = useTexture(StrokeTexture);

  const group = useRef<Group>(null);
  const sprite = useRef<Sprite>(null);
  const stroke = useRef<Sprite>(null);
  const scale = 1 / 40;

  const [{id, currentSystem: playerSystem, systemPosition}] =
    q.ship.player.useNetRequest();

  const {interpolate} = useLiveQuery();
  useFrame(props => {
    const {size} = props;
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);

    const playerPosition = interpolate(id);
    if (playerPosition) {
      playerVector.set(playerPosition.x, playerPosition.y, playerPosition.z);
      getWaypointRelativePosition(
        waypoint.position,
        waypoint.position.parentId,
        waypoint.systemPosition,
        systemPosition,
        playerSystem,
        waypointVector
      );

      if (!playerSystem) {
        // We're in interstellar space; multiply the positions
        playerVector.multiplyScalar(LY_IN_KM);
        waypointVector.multiplyScalar(LY_IN_KM);
      }
      let showOutOfBoundsArrow = playerVector.distanceTo(waypointVector) > dx;
      group.current?.scale.setScalar(dx * 3 * scale);
      if (viewscreen) {
        const scale = 0.03;
        group.current?.scale.setScalar(scale);
        frustum.setFromProjectionMatrix(
          matrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
          )
        );

        showOutOfBoundsArrow = !frustum.containsPoint(waypointVector);
      }
      if (showOutOfBoundsArrow) {
        if (group.current) {
          let screenPosition;
          if (viewscreen) {
            const perspectiveCamera = camera as Camera as PerspectiveCamera;

            // Calculate whether the camera is behind to properly adjust the screen position
            camera.getWorldDirection(cameraPosition);
            targetPosition.copy(waypointVector);
            var pos = targetPosition.sub(camera.position);
            const isBehind = pos.angleTo(cameraPosition) > Math.PI / 2;

            screenPosition = waypointVector.clone().project(camera);
            if (isBehind) {
              screenPosition.setX(screenPosition.x * -1);
              screenPosition.setY(screenPosition.y * -1);
            }

            // Calculate the z distance to project the 2D position onto
            const zDistance =
              Math.max(size.width, size.height) /
              (2 * 0.8) /
              Math.tan((DEG2RAD * perspectiveCamera.fov) / 2);

            screenPosition.setZ(0).normalize();
            const angle = Math.atan2(screenPosition.y, screenPosition.x);
            screenPosition
              .multiply(sizeVector.set(size.width, size.height, 0))
              .setZ(-zDistance)
              .applyQuaternion(camera.quaternion);
            group.current.position?.copy(camera.position).add(screenPosition);

            if (sprite.current && stroke.current) {
              sprite.current.material.rotation = angle + Math.PI / 2;
              stroke.current.material.rotation = angle + Math.PI / 2;
            }
          } else {
            // Render a rotated arrow in the direction of the waypoint.
            group.current?.position
              .subVectors(waypointVector, playerVector)
              .normalize()
              .multiplyScalar(dx * 0.9);
            screenPosition = group.current.position.clone().project(camera);
            const yPos =
              (screenPosition.y * size.height) / 2 / (size.height / 2);
            const xPos = (screenPosition.x * size.width) / 2 / (size.width / 2);

            const angle = Math.atan2(yPos, xPos);
            if (sprite.current && stroke.current) {
              sprite.current.material.rotation = angle + Math.PI / 2;
              stroke.current.material.rotation = angle + Math.PI / 2;
              if (
                usePilotStore.getState().facingWaypoints.includes(waypoint.id)
              ) {
                sprite.current.material.color.setRGB(0, 0.5, 1);
              } else {
                sprite.current.material.color.setRGB(0.9, 0.6, 0);
              }
            }
          }
        }
      } else {
        // Render the waypoint in space.
        if (viewscreen) {
          group.current?.position.copy(waypointVector);
        } else {
          group.current?.position.copy(waypointVector.sub(playerVector));
        }

        if (sprite.current && stroke.current) {
          sprite.current.material.rotation = 0;
          stroke.current.material.rotation = 0;
        }
      }
    }
  });
  return (
    <group renderOrder={100} ref={group}>
      <sprite ref={sprite} renderOrder={101} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={"rgb(230,153,0)"}
          sizeAttenuation={false}
          depthTest={false}
        ></spriteMaterial>
      </sprite>
      <sprite ref={stroke} renderOrder={100} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={strokeMap}
          color={"rgb(110,73,0)"}
          sizeAttenuation={false}
          depthTest={false}
        ></spriteMaterial>
      </sprite>
    </group>
  );
};
