import {ApolloProvider, useApolloClient} from "@apollo/client";
import {OrbitControls} from "client/components/core/OrbitControls";
import {CardProps} from "client/components/station/CardProps";
import {
  FC,
  Fragment,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {Color, MOUSE, Sprite, Vector3, Texture, Group} from "three";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
  useNavEntityQuery,
  useWaypointAddMutation,
} from "client/generated/graphql";
import {useConfigStore} from "client/components/starmap/configStore";
import {getOrbitPosition} from "client/components/starmap/utils";
import Star from "client/components/starmap/star";
import OrbitContainer from "client/components/starmap/OrbitContainer";
import Nebula from "client/components/starmap/Nebula";
import {Planet} from "client/components/starmap/entities/PlanetEntity";
import Button from "client/components/ui/button";
import {publish, subscribe} from "client/helpers/pubsub";
import {
  useShipsStore,
  useSystemShips,
} from "client/components/viewscreen/useSystemShips";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {ZoomStyleWrapper} from "../Pilot/ZoomStyleWrapper";
import {ErrorBoundary} from "react-error-boundary";
import {useTextureLoader} from "drei";
import SystemLabel from "client/components/starmap/SystemMarker/SystemLabel";
import Input from "client/components/ui/Input";
import {useSetupOrbitControls} from "client/helpers/useSetupOrbitControls";
import create from "zustand";
import {persist} from "zustand/middleware";
import {useTranslation} from "react-i18next";

interface NavigationStore extends Record<string, unknown> {
  selectedObjectId: string | null;
}
const useNavigationStore = create<NavigationStore>(
  persist(
    (set, get) => ({
      selectedObjectId: "5ax0v1ywrkgasq7t4",
    }),
    {
      name: "thorium-navigation-store", // unique name
    }
  )
);

const SUN_RADIUS = 696_340;

type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

const itemEvents = (entity: {id: string}) => ({
  onPointerOver: () => {
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "auto";
  },
  onClick: () => {
    useNavigationStore.setState({selectedObjectId: entity.id});
  },
});
const NavigationShipEntity = ({
  entityId,
  playerId,
}: {
  entityId: string;
  playerId?: string;
}) => {
  const entity = useShipsStore.getState()[entityId];
  // TODO: Replace with a ship icon.
  const spriteMap = useTextureLoader("/assets/icons/Pyramid.svg") as Texture;
  const scale = 1 / 20;
  const sprite = useRef<Sprite>(null);
  const group = useRef<Group>();

  useFrame(({camera}) => {
    const ship = useShipsStore.getState()[entityId];

    if (!ship) return;
    if (ship.position) {
      sprite.current?.position.set(
        ship.position.x,
        ship.position.y,
        ship.position.z
      );
      let zoom = 0;
      if (sprite.current) {
        zoom = camera.position.distanceTo(sprite.current.position) + 500;
        let zoomedScale = (zoom / 2) * scale;
        sprite.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      }
      if (group.current) {
        if (sprite.current) {
          group.current.position.copy(sprite.current?.position);
        }
        let zoomedScale = (zoom / 2) * 0.01;
        group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
        group.current.quaternion.copy(camera.quaternion);
      }
    }
  });
  if (!entity) return null;
  return (
    <group {...itemEvents(entity)}>
      <sprite ref={sprite}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={"white"}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
      <group ref={group} scale={[0.2, 0.2, 0.2]}>
        <SystemLabel
          systemId=""
          name={entity.identity.name}
          hoveringDirection={{current: 0}}
          scale={5 / 128}
        />
      </group>
    </group>
  );
};
const NavigationStarEntity: FC<{entity: EntityType}> = ({entity}) => {
  if (!entity.isStar || !entity.satellite) return null;
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
  } = entity.satellite;
  const color1 = new Color(
    `hsl(${entity.isStar.hue}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );
  const color2 = new Color(
    `hsl(${entity.isStar.hue + 20}, 100%, ${entity.isStar.isWhite ? 100 : 50}%)`
  );
  const size = entity.isStar.radius * SUN_RADIUS;
  return (
    <OrbitContainer
      radius={distance}
      eccentricity={eccentricity}
      orbitalArc={orbitalArc}
      orbitalInclination={orbitalInclination}
      showOrbit={showOrbit}
    >
      <group {...itemEvents(entity)} scale={[size, size, size]}>
        {/* {selected && configStoreApi.getState().viewingMode !== "viewscreen" && (
      <Selected />
    )} */}
        <Star
          color1={color1}
          color2={color2}
          size={size}
          noLensFlare
          showSprite
        />
      </group>
    </OrbitContainer>
  );
};

const NavigationPlanetEntity: FC<{
  entity: EntityType;
  isSatellite?: boolean;
  origin?: Vector3;
}> = ({entity, isSatellite, origin}) => {
  if (!entity.isPlanet || !entity.satellite) return null;
  const {
    distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
    showOrbit,
    axialTilt,
    satellites,
  } = entity.satellite;
  const {
    radius,
    cloudsMapAsset,
    ringsMapAsset,
    textureMapAsset,
  } = entity.isPlanet;

  const position = getOrbitPosition({
    radius: distance,
    eccentricity,
    orbitalArc,
    orbitalInclination,
  });

  return (
    <Fragment>
      <OrbitContainer
        // Convert KM to Millions of KM
        radius={distance}
        eccentricity={eccentricity}
        orbitalArc={orbitalArc}
        orbitalInclination={orbitalInclination}
        showOrbit={showOrbit}
      ></OrbitContainer>
      <Planet
        name={entity.identity.name}
        position={position}
        scaledPosition={position}
        scale={[radius, radius, radius]}
        clouds={cloudsMapAsset}
        rings={ringsMapAsset}
        texture={textureMapAsset}
        axialTilt={axialTilt}
        selected={false}
        showSprite
        showMesh={false}
        isSatellite={isSatellite}
        {...itemEvents(entity)}
      >
        {satellites?.map((s, i) => (
          <NavigationPlanetEntity
            key={`orbit-${i}`}
            isSatellite
            origin={position}
            entity={{
              ...s,
              satellite: s.satellite
                ? {
                    ...s.satellite,
                    satellites: [],
                  }
                : null,
            }}
          />
        ))}
      </Planet>
    </Fragment>
  );
};

const NavigationWaypointEntity = ({entity}: {entity: EntityType}) => {
  const color = "rgb(230,153,0)";
  const spriteMap = useTextureLoader(
    require("./Waypoint.svg").default
  ) as Texture;
  const strokeMap = useTextureLoader(
    require("./WaypointStroke.svg").default
  ) as Texture;
  const group = useRef<Group>();
  const scale = 1 / 10;

  useFrame(({camera}) => {
    if (!entity) return;
    if (entity.position) {
      group.current?.position.set(
        entity.position.x,
        entity.position.y,
        entity.position.z
      );
      let zoom = 0;
      if (group.current) {
        zoom = camera.position.distanceTo(group.current.position) + 500;
        let zoomedScale = (zoom / 2) * scale;
        group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      }
    }
  });
  if (!entity) return null;
  return (
    <group ref={group} renderOrder={100}>
      <sprite renderOrder={101} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={color}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
      <sprite renderOrder={100} position={[0, 0, -0.5]}>
        <spriteMaterial
          attach="material"
          map={strokeMap}
          color={"rgb(110,73,0)"}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
    </group>
  );
};
const NavigationPlanetary: FC<{systemId?: string}> = ({systemId}) => {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const {data} = useUniverseSystemSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const system = data?.universeSystem;
  const skyboxKey = system?.planetarySystem?.skyboxKey || "blank";
  useEffect(() => {
    useConfigStore.setState({skyboxKey});
  }, [skyboxKey]);
  const shipIds = useSystemShips();
  useFrame(({camera}) => {
    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    useConfigStore.setState({
      cameraVerticalDistance: distance,
    });
  });
  if (!flightPlayerData?.playerShip) return null;
  return (
    <group>
      {system?.items.map(e => {
        if (e.isStar) {
          return (
            <Suspense fallback={null}>
              <NavigationStarEntity key={e.id} entity={e} />
            </Suspense>
          );
        }
        if (e.isPlanet) {
          return (
            <Suspense fallback={null}>
              <NavigationPlanetEntity key={e.id} entity={e} />
            </Suspense>
          );
        }
        if (e.isWaypoint) {
          return (
            <Suspense fallback={null}>
              <NavigationWaypointEntity key={e.id} entity={e} />
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
              <NavigationShipEntity
                entityId={shipId}
                playerId={flightPlayerData.playerShip.id}
              />
            </ErrorBoundary>
          </Suspense>
        );
      })}
    </group>
  );
};

const distanceVector = new Vector3();
const NavigationCanvas = memo(() => {
  const controls = useRef<OrbitControls>();
  const {camera} = useThree();

  const {data: flightPlayerData} = useFlightPlayerShipSubscription();

  const systemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id;

  const playerShipId = flightPlayerData?.playerShip.id || "";
  const recenter = useCallback(
    function recenter() {
      // TODO: Make it so the camera follows the position of the ship until
      // the screen is panned again.
      const playerShip = useShipsStore.getState()[playerShipId];
      if (!playerShip) return;
      camera.position.set(
        playerShip.position?.x || 0,
        camera.position.y,
        playerShip.position?.z || 0
      );
      controls.current?.target?.set(camera.position.x, 0, camera.position.z);
      controls.current?.saveState?.();
    },
    [camera, playerShipId]
  );

  useSetupOrbitControls(controls);
  useEffect(() => {
    recenter();
    const unsub = subscribe("navigation_recenter", () => recenter());
    return () => unsub();
  }, [recenter]);

  if (!flightPlayerData?.playerShip) return null;

  return (
    <Fragment>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        ref={controls}
        enableRotate={false}
        enableKeys={false}
        zoomToCursor
        minDistance={10000}
        maxDistance={30000000000}
        maxPolarAngle={Math.PI / 3}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.RIGHT,
        }}
      />
      <Suspense fallback={null}>
        <Nebula />
      </Suspense>
      {systemId && <NavigationPlanetary systemId={systemId} />}
    </Fragment>
  );
});

const FAR = 1e27;
const CAMERA_Y = 30000000;

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
const Navigation: FC<CardProps> = ({cardLoaded}) => {
  const client = useApolloClient();
  const selectedObjectId = useNavigationStore(store => store.selectedObjectId);
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
          <Button className="w-full pointer-events-auto">
            Interstellar View
          </Button>
          <Button
            className="w-full pointer-events-auto"
            variantColor="warning"
            onClick={() => publish("navigation_recenter")}
          >
            Recenter
          </Button>
        </div>
        <div className="w-96 min-h-48 h-full flex flex-col gap-2">
          <div className="w-full p-4 border-2 border-whiteAlpha-500 bg-blackAlpha-500 rounded">
            {cardLoaded && object ? (
              <Fragment>
                <div className="float-left w-24 h-24 mx-2 border border-whiteAlpha-500 rounded">
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
                    : ""}
                </h4>
              </Fragment>
            ) : loading ? (
              <h3 className="text-2xl">{t("Accessing...")}</h3>
            ) : (
              <h3 className="text-2xl">{t("No Object Selected")}</h3>
            )}
          </div>
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
  const cameraZoom = useConfigStore(store => store.cameraVerticalDistance);

  return (
    <ZoomStyleWrapper className="pointer-events-auto">
      <p className="text-xl">Zoom:</p>
      <ZoomSlider
        value={cameraZoom}
        setValue={val =>
          useConfigStore.getState().orbitControlsSet({zoom: val})
        }
        zoomMin={10000}
        zoomMax={30000000000}
        step={0.01}
      />
    </ZoomStyleWrapper>
  );
};

export default Navigation;
