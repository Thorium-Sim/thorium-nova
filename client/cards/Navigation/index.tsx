import {ApolloProvider, useApolloClient} from "@apollo/client";
import {OrbitControls} from "client/components/core/OrbitControls";

import {CardProps} from "client/components/station/CardProps";
import {FC, Fragment, memo, Suspense, useEffect, useRef} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {Color, Group, MOUSE} from "three";
import {
  NavEntityQuery,
  UniverseInterstellarShipsHotSubscription,
  UniverseSystemShipsSubscription,
  useFlightPlayerShipSubscription,
  useFlightUniverseSubscription,
  useNavEntityQuery,
  useWaypointAddMutation,
} from "client/generated/graphql";
import Star from "client/components/starmap/star";
import {Planet} from "client/components/starmap/entities/PlanetEntity";
import Button from "client/components/ui/button";
import {publish} from "client/helpers/pubsub";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {ZoomStyleWrapper} from "../Pilot/ZoomStyleWrapper";
import Input from "client/components/ui/Input";

import {useTranslation} from "react-i18next";
import {NavigationPlanetary} from "./NavigationPlanetary";
import {CAMERA_Y, useNavigationStore} from "./utils";
import Starfield from "client/components/starmap/Starfield";
import SystemMarker from "client/components/starmap/SystemMarker";
import {
  useInterstellarShips,
  useInterstellarShipsStore,
} from "client/components/viewscreen/useInterstellarShips";
import {ErrorBoundary} from "react-error-boundary";
import {NavigationInterstellarShipEntity} from "./NavigationShipEntity";
import {useSetupOrbitControls} from "client/helpers/useSetupOrbitControls";
import {useSystemShipsStore} from "client/components/viewscreen/useSystemShips";
import useAnimationFrame from "client/helpers/unused/useAnimationFrame";
import {getOrbitPosition} from "client/components/starmap/utils";

const NavigationInterstellar = memo(
  ({
    initialPosition,
  }: {
    initialPosition?: {x: number; y: number; z: number} | null;
  }) => {
    const orbitControls = useRef<OrbitControls>();
    const frameCount = useRef(0);

    const {data} = useFlightUniverseSubscription();

    const shipIds = useInterstellarShips();

    useFrame((state, delta) => {
      // Auto rotate, but at a very slow rate, so as to keep the
      // starfield visible
      frameCount.current = (frameCount.current + delta) % 125.663;
      if (orbitControls.current) {
        orbitControls.current.autoRotateSpeed =
          Math.sin(frameCount.current / 100) / 100;
      }
    });
    useSetupOrbitControls(orbitControls, useNavigationStore);
    const {x, y, z} = initialPosition || {};
    const {camera} = useThree();
    useEffect(() => {
      if (x && y && z && orbitControls.current) {
        orbitControls.current.reset?.();
        camera.position.set(x, y + 10, z);
        orbitControls.current?.target?.set(x, y, z);
        orbitControls.current?.saveState?.();
      }
    }, [x, y, z, camera]);
    return (
      <Suspense fallback={null}>
        <OrbitControls
          ref={orbitControls}
          zoomToCursor
          autoRotate
          maxDistance={1300}
          minDistance={1}
          rotateSpeed={0.5}
          screenSpacePanning
          mouseButtons={{
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.RIGHT,
          }}
        />

        <Starfield />
        {data?.flightUniverse.map(s => (
          <SystemMarker
            key={s.id}
            system={s}
            position={[
              s.position?.x || 0,
              s.position?.y || 0,
              s.position?.z || 0,
            ]}
            name={s.identity.name}
            onPointerDown={() => {
              useNavigationStore.setState({selectedObjectId: s.id});
            }}
            onDoubleClick={() => useNavigationStore.setState({systemId: s.id})}
          />
        ))}
        {shipIds.map(shipId => {
          return (
            <Suspense key={shipId} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <Fragment></Fragment>}
                onError={err => console.error(err)}
              >
                <NavigationInterstellarShipEntity entityId={shipId} />
              </ErrorBoundary>
            </Suspense>
          );
        })}
      </Suspense>
    );
  }
);

const NavigationCanvas = memo(() => {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const playerShipId = flightPlayerData?.playerShip.id || "";
  const playerShipSystemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id || null;
  const systemId = useNavigationStore(state => state.systemId);

  useEffect(() => {
    useNavigationStore.setState({
      playerShipId,
      playerShipSystemId,
      systemId: playerShipSystemId,
    });
  }, [playerShipId, playerShipSystemId]);

  if (!flightPlayerData?.playerShip) return null;
  return (
    <Fragment>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />

      {systemId && (
        <NavigationPlanetary
          systemId={systemId}
          playerShipId={playerShipId}
          flightPlayerData={flightPlayerData}
        />
      )}
      {!systemId && (
        <NavigationInterstellar
          initialPosition={
            flightPlayerData.playerShip.interstellarPosition?.system?.position
          }
        />
      )}
    </Fragment>
  );
});
NavigationCanvas.displayName = "Navigation Canvas";

const FAR = 1e27;

const StarCanvas = ({hue, isWhite}: {hue: number; isWhite: boolean}) => {
  const color1 = new Color(`hsl(${hue}, 100%, ${isWhite ? 100 : 50}%)`);
  const color2 = new Color(`hsl(${hue + 20}, 100%, ${isWhite ? 100 : 50}%)`);
  return (
    <Canvas camera={{position: [0, 0, 1.2]}}>
      <Star color1={color1} color2={color2} size={1} noLensFlare showSprite />
    </Canvas>
  );
};
const PlanetGroup = ({
  cloudsMapAsset,
  ringsMapAsset,
  textureMapAsset,
}: {
  cloudsMapAsset: string;
  ringsMapAsset: string;
  textureMapAsset: string;
}) => {
  const planetRef = useRef<Group>();
  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotateY(0.002);
    }
  });
  return (
    <group ref={planetRef}>
      <Planet
        name=""
        scale={[1, 1, 1]}
        clouds={cloudsMapAsset}
        texture={textureMapAsset}
        rings={""}
        axialTilt={12}
        selected={false}
        isSatellite={true}
      />
    </group>
  );
};
const PlanetCanvas = (props: {
  cloudsMapAsset: string;
  ringsMapAsset: string;
  textureMapAsset: string;
}) => {
  return (
    <Canvas camera={{position: [0, 0, 1.8]}}>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} />
      <PlanetGroup {...props} />
    </Canvas>
  );
};

export function distance3d(
  coord2: {x: number; y: number; z: number},
  coord1: {x: number; y: number; z: number}
) {
  const {x: x1, y: y1, z: z1} = coord1;
  let {x: x2, y: y2, z: z2} = coord2;
  return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2 + (z2 -= z1) * z2);
}

function getDistance(
  object: NavEntityQuery["entity"],
  playerShip:
    | UniverseSystemShipsSubscription["universeSystemShips"][0]
    | UniverseInterstellarShipsHotSubscription["universeInterstellarShipsHot"][0]
) {
  if (
    object?.planetarySystem &&
    object.position &&
    playerShip.interstellarPosition &&
    playerShip.position
  ) {
    // Distance to planetary systems
    if (
      playerShip.interstellarPosition?.system &&
      "position" in playerShip.interstellarPosition.system &&
      playerShip.interstellarPosition.system.position
    ) {
      return `${distance3d(
        object.position,
        playerShip.interstellarPosition.system.position
      ).toFixed(1)} LY`;
    } else {
      return `${distance3d(object.position, playerShip.position).toFixed(
        1
      )} LY`;
    }
  }
  // Distance from one system to another system's objects
  if (
    playerShip.interstellarPosition?.system &&
    playerShip.interstellarPosition.system.id !==
      object?.interstellarPosition?.system?.id &&
    object?.interstellarPosition?.system?.position &&
    "position" in playerShip.interstellarPosition.system &&
    playerShip.interstellarPosition.system.position
  ) {
    return `${distance3d(
      object.interstellarPosition.system.position,
      playerShip.interstellarPosition.system.position
    ).toFixed(1)} LY`;
  }
  // Distance from interstellar to planetary objects
  if (
    !playerShip.interstellarPosition?.system &&
    playerShip.position &&
    object?.interstellarPosition?.system?.position
  ) {
    return `${distance3d(
      object.interstellarPosition.system.position,
      playerShip.position
    ).toFixed(1)} LY`;
  }
  // Distance from one planetary object to another
  if (
    playerShip.interstellarPosition?.system?.id ===
      object?.interstellarPosition?.system?.id &&
    playerShip.position
  ) {
    // A ship
    let position = object?.position;
    if (!position && object?.satellite) {
      // A satellite
      const {
        distance,
        eccentricity,
        orbitalArc,
        orbitalInclination,
      } = object.satellite;
      position = getOrbitPosition({
        radius: distance,
        eccentricity,
        orbitalArc,
        orbitalInclination,
      });
    }
    if (position) {
      let distance = distance3d(position, playerShip.position);
      if (distance > 100) {
        distance = Math.round(distance);
      }
      if (distance < 1) {
        return `${(distance * 1000).toLocaleString()} M`;
      }
      return `${distance.toLocaleString()} KM`;
    }
  }
  return "Unknown";
}
const ObjectDetails = ({
  cardLoaded,
  loading,
  object,
}: {
  cardLoaded: boolean;
  loading: boolean;
  object: NavEntityQuery["entity"] | undefined;
}) => {
  const {t} = useTranslation();
  const {data: playerShipData} = useFlightPlayerShipSubscription();
  const distanceRef = useRef<HTMLSpanElement>(null);
  useAnimationFrame(() => {
    if (distanceRef.current && object) {
      const playerShip = playerShipData?.playerShip.interstellarPosition?.system
        ?.id
        ? useSystemShipsStore.getState()[playerShipData.playerShip.id]
        : useInterstellarShipsStore.getState()[
            playerShipData?.playerShip.id || ""
          ];
      const distance = getDistance(object, playerShip);
      distanceRef.current.innerText = distance;
    }
  });

  return (
    <div className="w-full p-2 border-2 border-whiteAlpha-500 bg-blackAlpha-500 rounded">
      {cardLoaded && object ? (
        <Fragment>
          {object.planetarySystem ? null : (
            <div className="float-left w-24 h-24 mr-2 border border-whiteAlpha-500 rounded">
              {object.isPlanet ? (
                <PlanetCanvas {...object.isPlanet} />
              ) : object.isStar ? (
                <StarCanvas
                  hue={object.isStar.hue}
                  isWhite={object.isStar.isWhite}
                />
              ) : object.isShip ? (
                <img
                  draggable="false"
                  alt={object.identity.name}
                  src={object.shipAssets?.vanity}
                />
              ) : null}
            </div>
          )}
          <h3 className="text-2xl">{object.identity.name}</h3>
          <h4 className="text-xl">
            {object.isPlanet
              ? `Class ${object.isPlanet.classification} Planet`
              : object.isStar
              ? `Class ${object.isStar.spectralType} Star`
              : object.isShip
              ? `${
                  object.isShip.shipClass
                    ? `${object.isShip.shipClass} Class `
                    : ""
                }${object.isShip.category}`
              : object.planetarySystem
              ? "Planetary System"
              : ""}
          </h4>
          {playerShipData?.playerShip ? (
            <h4 className="text-xl">
              <strong>Distance:</strong> <span ref={distanceRef}></span>
            </h4>
          ) : null}
        </Fragment>
      ) : loading ? (
        <h3 className="text-2xl">{t("Accessing...")}</h3>
      ) : (
        <h3 className="text-2xl">{t("No Object Selected")}</h3>
      )}
    </div>
  );
};
const Navigation: FC<CardProps> = ({cardLoaded}) => {
  const client = useApolloClient();
  const selectedObjectId = useNavigationStore(store => store.selectedObjectId);
  const systemId = useNavigationStore(store => store.systemId);
  const {data, loading} = useNavEntityQuery({
    variables: {id: selectedObjectId || ""},
    skip: !selectedObjectId,
  });
  const object = data?.entity;
  const {t} = useTranslation();
  const [addWaypoint] = useWaypointAddMutation();
  return (
    <div className="relative card-navigation h-full w-full border border-whiteAlpha-500 bg-black">
      <div className="h-full w-full p-4 absolute z-10 flex justify-between pointer-events-none">
        <div className="w-72 h-full flex flex-col space-y-2">
          <Input
            label="Search"
            placeholder="Search..."
            className="pointer-events-auto"
          />
          <div className="flex-1"></div>
          <ZoomSliderComp />
          {systemId && (
            <Button
              className="w-full pointer-events-auto"
              onClick={() => {
                useNavigationStore.setState({systemId: null});
                publish("navigation_change_system", null);
              }}
            >
              Interstellar View
            </Button>
          )}
          <Button
            className="w-full pointer-events-auto"
            variantColor="warning"
            onClick={() => {
              useNavigationStore.setState({
                systemId: useNavigationStore.getState().playerShipSystemId,
              });
              publish("navigation_recenter");
            }}
          >
            Recenter
          </Button>
        </div>
        <div className="w-1/4 min-h-48 h-full flex flex-col gap-2">
          <ObjectDetails
            loading={loading}
            cardLoaded={cardLoaded}
            object={object}
          />
          {object?.planetarySystem ? (
            <Button
              color="info"
              className="w-full pointer-events-auto"
              onClick={() =>
                useNavigationStore.setState({
                  systemId: object.id,
                  selectedObjectId: null,
                })
              }
            >
              {t("Enter System")}
            </Button>
          ) : (
            <Button
              color="info"
              className="w-full pointer-events-auto"
              disabled={!object}
              onClick={() =>
                object &&
                addWaypoint({
                  variables: {
                    shipId: null,
                    systemId: null,
                    position: null,
                    objectId: object.id,
                  },
                })
              }
            >
              {t("Add Waypoint")}
            </Button>
          )}
        </div>
      </div>
      {cardLoaded && (
        <div className="absolute top-0 left-0 w-full h-full">
          <Canvas
            camera={{fov: 45, near: 0.01, far: FAR, position: [0, CAMERA_Y, 0]}}
            gl={{antialias: true, logarithmicDepthBuffer: true}}
            concurrent
            onPointerMissed={() =>
              useNavigationStore.setState({selectedObjectId: null})
            }
          >
            <ApolloProvider client={client}>
              <Suspense fallback={null}>
                <NavigationCanvas />
              </Suspense>
            </ApolloProvider>
          </Canvas>
        </div>
      )}
    </div>
  );
};

const ZoomSliderComp = () => {
  const cameraZoom = useNavigationStore(
    store => store.cameraPlanetaryVerticalDistance
  );

  return (
    <ZoomStyleWrapper className="pointer-events-auto">
      <p className="text-xl">Zoom:</p>
      <ZoomSlider
        value={cameraZoom}
        setValue={val =>
          useNavigationStore.getState().orbitControlsSet({zoom: val})
        }
        zoomMin={10000}
        zoomMax={30000000000}
        step={0.01}
      />
    </ZoomStyleWrapper>
  );
};

export default Navigation;