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
import useLocalStorage from "client/helpers/hooks/useLocalStorage";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
} from "client/generated/graphql";
import {useConfigStore} from "client/components/starmap/configStore";
import {getOrbitPosition} from "client/components/starmap/utils";
import Star from "client/components/starmap/star";
import OrbitContainer from "client/components/starmap/OrbitContainer";
import Nebula from "client/components/starmap/Nebula";
import {Planet} from "client/components/starmap/entities/PlanetEntity";
import {useTranslate2DTo3D} from "client/helpers/hooks/use2Dto3D";
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
const SUN_RADIUS = 696_340;

type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

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
      // Since the sensor grid needs to be oriented at 0,0,0
      // to properly tilt, we reposition the contacts relative
      // to the player ship's position.
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
    // sprite.current?.scale.setScalar(dx * 3 * scale);
  });
  return (
    <group>
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
      <group
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: distance,
          });
          useConfigStore.setState({
            hoveredPosition: position,
            scaledHoveredPosition: position,
          });
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          useConfigStore.setState({
            hoveredPosition: null,
            scaledHoveredPosition: null,
          });
        }}
        onClick={() => {
          const position = getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: distance,
          });
          // configStoreApi.setState({
          //   selectedObject: entity,
          //   selectedPosition: position,
          //   scaledSelectedPosition: position,
          // });
        }}
        scale={[size, size, size]}
      >
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

  const orbitRadius = distance;
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
        isSatellite={isSatellite}
        onPointerOver={() => {
          const hoveredPosition = getOrbitPosition({
            eccentricity,
            orbitalArc,
            orbitalInclination,
            radius: orbitRadius,
            origin,
          });
          // useConfigStore.setState({
          //   hoveredPosition,
          //   scaledHoveredPosition: getOrbitPosition({
          //     eccentricity,
          //     orbitalArc,
          //     orbitalInclination,
          //     radius: orbitRadius * PLANETARY_SCALE * (isSatellite ? 100 : 1),
          //     origin: scaledOrigin,
          //   }),
          // });
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          useConfigStore.setState({
            hoveredPosition: null,
            scaledHoveredPosition: null,
          });
        }}
        onClick={() => {
          // configStoreApi.setState({
          //   selectedObject: entity,
          //   selectedPosition: getOrbitPosition({
          //     eccentricity,
          //     orbitalArc,
          //     orbitalInclination,
          //     radius: orbitRadius,
          //     origin,
          //   }),
          //   scaledSelectedPosition: getOrbitPosition({
          //     eccentricity,
          //     orbitalArc,
          //     orbitalInclination,
          //     radius: orbitRadius * PLANETARY_SCALE * (isSatellite ? 100 : 1),
          //     origin: scaledOrigin,
          //   }),
          // });
        }}
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
          return <NavigationStarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <NavigationPlanetEntity key={e.id} entity={e} />;
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

const Navigation: FC<CardProps> = ({cardLoaded}) => {
  const client = useApolloClient();

  return (
    <div className="relative card-navigation h-full w-full border border-whiteAlpha-500 bg-black">
      <div className="h-full p-4 absolute z-10">
        <div className="w-72 h-full flex flex-col space-y-2">
          <Input label="Search" placeholder="Search..." />
          <div className="flex-1"></div>
          <ZoomSliderComp />
          <Button className="w-full">Interstellar View</Button>
          <Button
            className="w-full"
            variantColor="warning"
            onClick={() => publish("navigation_recenter")}
          >
            Recenter
          </Button>
        </div>
      </div>
      {cardLoaded && (
        <div className="absolute top-0 left-0 w-full h-full">
          <Canvas
            camera={{fov: 45, near: 0.01, far: FAR, position: [0, CAMERA_Y, 0]}}
            gl={{antialias: true, logarithmicDepthBuffer: true}}
            concurrent
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
    <ZoomStyleWrapper>
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
