import {DEG_TO_RAD} from "client/components/starmap/utils";
import {
  useSystemShipsStore,
  useSystemShips,
} from "client/components/viewscreen/useSystemShips";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
} from "client/generated/graphql";
import {useTexture} from "drei";
import {Fragment, memo, Suspense, useRef} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useFrame} from "react-three-fiber";
import {
  Frustum,
  Group,
  OrthographicCamera,
  Sprite,
  Texture,
  Vector3,
  Matrix4,
  PerspectiveCamera,
  Camera,
} from "three";
import {PlanetaryEntity} from "./SimplePlanet";
import {ShipEntity} from "./SimpleShip";
type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

const playerVector = new Vector3();
const waypointVector = new Vector3();
const sizeVector = new Vector3();
const targetPosition = new Vector3();
const cameraPosition = new Vector3();
const frustum = new Frustum();
const matrix = new Matrix4();
export const WaypointEntity = ({
  entity,
  playerId,
  viewscreen,
}: {
  entity: EntityType;
  playerId: string;
  viewscreen?: boolean;
}) => {
  const spriteMap = useTexture(
    require("../Navigation/Waypoint.svg").default
  ) as Texture;
  const strokeMap = useTexture(
    require("../Navigation/WaypointStroke.svg").default
  ) as Texture;

  const group = useRef<Group>();
  const sprite = useRef<Sprite>();
  const stroke = useRef<Sprite>();
  const scale = 1 / 40;

  useFrame(props => {
    const {size} = props;
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);

    const playerShip = useSystemShipsStore.getState()[playerId];
    if (playerShip?.position) {
      playerVector.set(
        playerShip.position.x,
        playerShip.position.y,
        playerShip.position.z
      );
      if (entity.position) {
        waypointVector.set(
          entity.position.x,
          entity.position.y,
          entity.position.z
        );
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
              const perspectiveCamera = (camera as Camera) as PerspectiveCamera;

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
                Math.tan((DEG_TO_RAD * perspectiveCamera.fov) / 2);

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
              const xPos =
                (screenPosition.x * size.width) / 2 / (size.width / 2);

              const angle = Math.atan2(yPos, xPos);
              if (sprite.current && stroke.current) {
                sprite.current.material.rotation = angle + Math.PI / 2;
                stroke.current.material.rotation = angle + Math.PI / 2;
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
export const PilotContacts = memo(({tilted}: {tilted: boolean}) => {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const systemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id;
  const {data} = useUniverseSystemSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const system = data?.universeSystem;
  const shipIds = useSystemShips();
  if (!flightPlayerData?.playerShip) return null;
  return (
    <group>
      {system?.items.map(e => {
        if (e.isStar || e.isPlanet) {
          return (
            <PlanetaryEntity
              key={e.id}
              entity={e}
              playerId={flightPlayerData.playerShip.id}
            />
          );
        }
        if (e.isWaypoint) {
          return (
            <WaypointEntity
              key={e.id}
              entity={e}
              playerId={flightPlayerData.playerShip.id}
            />
          );
        }
        return null;
      })}
      {/* For some reason, the player ship isn't appearing. Figure out why and fix it. */}
      {shipIds.map(shipId => {
        return (
          <Suspense key={shipId} fallback={null}>
            <ErrorBoundary FallbackComponent={fallback} onError={onError}>
              <ShipEntity
                entityId={shipId}
                playerId={flightPlayerData.playerShip.id}
                tilted={tilted}
              />
            </ErrorBoundary>
          </Suspense>
        );
      })}
    </group>
  );
});

const onError = err => console.error(err);
const fallback = () => <Fragment></Fragment>;
