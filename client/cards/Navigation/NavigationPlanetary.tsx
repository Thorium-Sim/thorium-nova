import {FC, Fragment, Suspense, useCallback, useEffect, useRef} from "react";
import {useFrame, useThree} from "react-three-fiber";
import {MOUSE, Vector3} from "three";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
} from "client/generated/graphql";
import {OrbitControls} from "client/components/core/OrbitControls";
import {subscribe} from "client/helpers/pubsub";
import {useShipsStore} from "client/components/viewscreen/useSystemShips";
import {useSetupOrbitControls} from "client/helpers/useSetupOrbitControls";
import {useSystemShips} from "client/components/viewscreen/useSystemShips";
import {ErrorBoundary} from "react-error-boundary";
import {NavigationStarEntity} from "./NavigationStarEntity";
import {NavigationPlanetEntity} from "./NavigationPlanetEntity";
import {NavigationShipEntity} from "./NavigationShipEntity";
import {NavigationWaypointEntity} from "./NavigationWaypointEntity";
import {useNavigationStore} from "./utils";

const distanceVector = new Vector3();
export const NavigationPlanetary: FC<{
  systemId?: string;
  playerShipId: string;
}> = ({systemId, playerShipId}) => {
  const {camera} = useThree();
  const recentering = useRef(false);
  const controls = useRef<OrbitControls>();

  const recenter = useCallback(
    function recenter() {
      const playerShip = useShipsStore.getState()[playerShipId];
      if (
        !playerShip ||
        playerShip.interstellarPosition?.system?.id !== systemId
      ) {
        camera.position.set(0, camera.position.y, 0);
        controls.current?.target?.set(0, 0, 0);
      } else {
        camera.position.set(
          playerShip.position?.x || 0,
          camera.position.y,
          playerShip.position?.z || 0
        );
        controls.current?.target?.set(
          playerShip.position?.x || 0,
          0,
          playerShip.position?.z || 0
        );
      }
      controls.current?.saveState?.();
      recentering.current = true;
    },
    [camera, playerShipId, systemId]
  );
  useEffect(() => {
    const unsub = subscribe("navigation_change_system", systemId => {
      recentering.current = false;
      useNavigationStore.setState({selectedObjectId: null});
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    recenter();
    const unsub = subscribe("navigation_recenter", () => {
      recentering.current = true;
      recenter();
    });
    return () => unsub();
  }, [recenter]);

  useFrame(() => {
    if (recentering.current) {
      recenter();
    }
  });
  useSetupOrbitControls(controls, useNavigationStore);

  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const {data} = useUniverseSystemSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const system = data?.universeSystem;
  const shipIds = useSystemShips();
  useFrame(({camera}) => {
    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    useNavigationStore.setState({
      cameraPlanetaryVerticalDistance: distance,
    });
  });
  if (!flightPlayerData?.playerShip) return null;

  return (
    <group>
      <OrbitControls
        ref={controls}
        enableRotate={false}
        enableKeys={false}
        zoomToCursor
        minDistance={10000}
        maxDistance={30000000000}
        maxPolarAngle={Math.PI / 3}
        onPanDrag={() => {
          recentering.current = false;
        }}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.RIGHT,
        }}
      />
      {system?.items.map(e => {
        if (e.isStar) {
          return (
            <Suspense fallback={null} key={e.id}>
              <NavigationStarEntity entity={e} />
            </Suspense>
          );
        }
        if (e.isPlanet) {
          return (
            <Suspense fallback={null} key={e.id}>
              <NavigationPlanetEntity entity={e} />
            </Suspense>
          );
        }
        if (e.isWaypoint) {
          return (
            <Suspense fallback={null} key={e.id}>
              <NavigationWaypointEntity entity={e} />
            </Suspense>
          );
        }
        return null;
      })}
      {shipIds.map(shipId => {
        return (
          <Suspense key={shipId} fallback={null}>
            <ErrorBoundary
              FallbackComponent={() => <Fragment></Fragment>}
              onError={err => console.error(err)}
            >
              <NavigationShipEntity entityId={shipId} />
            </ErrorBoundary>
          </Suspense>
        );
      })}
    </group>
  );
};
