import {CardProps} from "client/components/station/CardProps";
import {
  FC,
  Fragment,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {Canvas, useFrame, useThree} from "react-three-fiber";
import {useSpring} from "react-spring/three";
import Button from "client/components/ui/button";
import {ZoomSlider} from "client/components/core/ZoomSlider";
import {Arrow} from "./PlayerArrow";
import {Circle} from "./DistanceCircle";
import {
  useFlightPlayerShipSubscription,
  useUniverseSystemSubscription,
} from "client/generated/graphql";
import {
  useSystemShips,
  useShipsStore,
} from "client/components/viewscreen/useSystemShips";
import {ErrorBoundary} from "react-error-boundary";
import {DEG_TO_RAD, getOrbitPosition} from "client/components/starmap/utils";
import {
  BufferAttribute,
  DoubleSide,
  Group,
  Mesh,
  OrthographicCamera,
  Plane,
  Quaternion,
  RingBufferGeometry,
  Sprite,
  Texture,
  Vector3,
} from "three";
import {Line, useTextureLoader} from "drei";
import {useClientData} from "client/components/clientLobby/ClientContext";
import {ApolloProvider, useApolloClient} from "@apollo/client";
import {Line2} from "three/examples/jsm/lines/Line2";

// Both of these are in kilometers
const zoomMax = 11000;
const zoomMin = 0.011;

const CameraEffects = ({
  zoomValue = 1,
  setDimensions,
}: {
  zoomValue: number;
  setDimensions: (param: {width: number; height: number}) => void;
}) => {
  const {camera, size} = useThree();
  useEffect(() => {
    setDimensions({width: size.width, height: size.height});
  }, [size, setDimensions]);
  useEffect(() => {
    // @ts-ignore
    camera.zoom = zoomValue;
    camera.updateProjectionMatrix();
  }, [zoomValue, camera]);
  return null;
};

const SUN_RADIUS = 696_340;
type EntityType = NonNullable<
  ReturnType<typeof useUniverseSystemSubscription>["data"]
>["universeSystem"]["items"][0];

const BasicRings = () => {
  const geo = useMemo(() => {
    const geometry = new RingBufferGeometry(1.5, 3, 64);
    const pos = geometry.attributes.position as BufferAttribute;
    const v3 = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      geometry.attributes.uv.setXY(i, v3.length() < 2 ? 0 : 1, 1);
    }
    return geometry;
  }, []);
  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      scale={[0.7, 0.7, 0.7]}
      geometry={geo}
      receiveShadow
    >
      <meshBasicMaterial
        color={0xffffff}
        side={DoubleSide}
        wireframe
        transparent
        opacity={0.8}
        attach="material"
      />
    </mesh>
  );
};
const PlanetaryEntity = memo(
  ({entity, playerId}: {entity: EntityType; playerId: string}) => {
    const ref = useRef<Group>();
    useFrame(() => {
      const playerShip = useShipsStore.getState()[playerId];
      if (
        !playerShip?.position ||
        (!entity.isPlanet && !entity.isStar) ||
        !entity.satellite
      )
        return;
      const position = getOrbitPosition({
        radius: entity.satellite.distance,
        eccentricity: entity.satellite.eccentricity,
        orbitalArc: entity.satellite.orbitalArc,
        orbitalInclination: entity.satellite.orbitalInclination,
      });
      ref.current?.position.set(
        position.x - playerShip.position.x,
        position.y - playerShip.position.y,
        position.z - playerShip.position.z
      );
    });
    if ((!entity.isPlanet && !entity.isStar) || !entity.satellite) return null;
    const size = entity.isPlanet
      ? entity.isPlanet.radius
      : entity.isStar
      ? entity.isStar.radius * SUN_RADIUS
      : 0;

    return (
      <group
        ref={ref}
        scale={[size, size, size]}
        rotation={[0, 0, entity.satellite.axialTilt * DEG_TO_RAD]}
      >
        <mesh>
          <icosahedronBufferGeometry args={[1, 3]} attach="geometry" />
          <meshBasicMaterial wireframe color="white" attach="material" />
        </mesh>
        {entity.isPlanet?.ringsMapAsset && <BasicRings />}
      </group>
    );
  }
);
const zeroVector = new Vector3();
const upVector = new Vector3(0, 1, 0);
const playerQuaternion = new Quaternion();
const plane = new Plane();
const ShipEntity = ({
  entityId,
  playerId,
  tilted,
}: {
  entityId: string;
  playerId?: string;
  tilted?: boolean;
}) => {
  // TODO: Replace with a ship icon.
  const spriteMap = useTextureLoader("/assets/icons/Pyramid.svg") as Texture;
  const scale = 1 / 50;
  const mesh = useRef<Mesh>(null);
  const line = useRef<Line2>(null);
  const sprite = useRef<Sprite>(null);
  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    const ship = useShipsStore.getState()[entityId];
    const playerShip = useShipsStore.getState()[playerId || ""];
    const playerPosition = playerShip.position || zeroVector;

    if (!ship) return;
    // shipMesh.current?.scale.set(scale, scale, scale);
    if (ship.position) {
      // Since the sensor grid needs to be oriented at 0,0,0
      // to properly tilt, we reposition the contacts relative
      // to the player ship's position.
      sprite.current?.position.set(
        ship.position.x - playerPosition.x,
        ship.position.y - playerPosition.y,
        ship.position.z - playerPosition.z
      );

      if (
        playerShip.rotation &&
        sprite.current?.position &&
        mesh.current?.position
      ) {
        const planeVector = upVector
          .clone()
          .applyQuaternion(
            playerQuaternion.set(
              playerShip.rotation.x,
              playerShip.rotation.y,
              playerShip.rotation.z,
              playerShip.rotation.w
            )
          );
        plane.set(planeVector, 0);
        plane.projectPoint(sprite.current.position, mesh.current.position);
        const positions = [
          ...sprite.current.position.toArray(),
          ...mesh.current.position.toArray(),
        ];
        line.current?.geometry.setPositions(positions);
        if (mesh.current && line.current)
          if (tilted) {
            mesh.current.visible = true;
            line.current.visible = true;
          } else {
            mesh.current.visible = false;
            line.current.visible = false;
          }
      }
    }
    sprite.current?.scale.setScalar(dx * 3 * scale);
    mesh.current?.scale.setScalar(dx * 3);
    if (playerShip.rotation) {
      mesh.current?.quaternion.set(
        playerShip.rotation.x,
        playerShip.rotation.y,
        playerShip.rotation.z,
        playerShip.rotation.w
      );
      mesh.current?.rotateX(Math.PI / 2);
    }
  });

  if (entityId === playerId) return null;
  return (
    <Fragment>
      <sprite ref={sprite}>
        <spriteMaterial
          attach="material"
          map={spriteMap}
          color={"white"}
          sizeAttenuation={true}
        ></spriteMaterial>
      </sprite>
      <Line
        ref={line}
        points={[
          [0, 0, 0],
          [0, 0, 0],
        ]}
        color={"white"}
        lineWidth={1}
      ></Line>
      <mesh ref={mesh}>
        <planeBufferGeometry args={[0.01, 0.01]} attach="geometry" />
        <meshBasicMaterial attach="material" color="white" side={DoubleSide} />
      </mesh>
    </Fragment>
  );
};
const PilotContacts = memo(({tilted}: {tilted: boolean}) => {
  const {data: flightPlayerData} = useFlightPlayerShipSubscription();
  const systemId =
    flightPlayerData?.playerShip.interstellarPosition?.system?.id;
  const {data} = useUniverseSystemSubscription({
    variables: {systemId: systemId || ""},
    skip: !systemId,
  });
  const system = data?.universeSystem;
  const shipIds = useSystemShips(systemId || "");
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
        return null;
      })}
      {shipIds.map(shipId => {
        return (
          <Suspense key={shipId} fallback={null}>
            <ErrorBoundary
              FallbackComponent={() => <Fragment></Fragment>}
              onError={err => console.error(err)}
            >
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
const cameraQuaternionMultiplier = new Quaternion(
  0.49999999999999994,
  0,
  0,
  0.8660254037844387
);
const forwardQuaternion = new Quaternion(0, 1, 0, 0);
const CircleGrid = memo(
  ({tilted, playerShipId}: {tilted: boolean; playerShipId: string}) => {
    const circleGroup = useRef<Group>(null);
    const tiltRef = useRef(0);
    useSpring({
      tilt: tilted ? 1 : 0,
      onChange: value => (tiltRef.current = value.tilt),
    });
    useFrame(props => {
      const playerShip = useShipsStore.getState()[playerShipId];
      if (playerShip?.position && playerShip?.rotation && circleGroup.current) {
        circleGroup.current.position.set(0, 0, 0);
        circleGroup.current.quaternion
          .set(
            playerShip.rotation.x,
            playerShip.rotation.y,
            playerShip.rotation.z,
            playerShip.rotation.w
          )
          .multiply(forwardQuaternion);

        const camera = props.camera as OrthographicCamera;
        const untiltedQuaternion = circleGroup.current.quaternion.clone();
        const tiltedQuaternion = untiltedQuaternion
          .clone()
          .multiply(cameraQuaternionMultiplier);
        camera.position
          .set(0, zoomMax, 0)
          .applyQuaternion(
            untiltedQuaternion.slerp(tiltedQuaternion, tiltRef.current)
          );
        camera.quaternion.set(
          playerShip.rotation.x,
          playerShip.rotation.y,
          playerShip.rotation.z,
          playerShip.rotation.w
        );
        camera.rotateX(-Math.PI / 2 - (Math.PI / 3) * tiltRef.current);
        camera.rotateZ(Math.PI);
      }
    });
    return (
      <Fragment>
        <group rotation={[0, 0, 0]}>
          <group ref={circleGroup}>
            <Circle radius={10000} />
            <Circle radius={7500} />
            <Circle radius={5000} />
            <Circle radius={2500} />
            <Circle radius={1800} />
            <Circle radius={1000} />
            <Circle radius={750} />
            <Circle radius={500} />
            <Circle radius={250} />
            <Circle radius={180} />
            <Circle radius={100} />
            <Circle radius={75} />
            <Circle radius={50} />
            <Circle radius={25} />
            <Circle radius={18} />
            <Circle radius={10} />
            <Circle radius={7.5} />
            <Circle radius={5.0} />
            <Circle radius={2.5} />
            <Circle radius={1.8} />
            <Circle />
            <Circle radius={0.75} />
            <Circle radius={0.5} />
            <Circle radius={0.25} />
            <Circle radius={0.18} />
            <Circle radius={0.1} />
            <Circle radius={0.075} />
            <Circle radius={0.05} />
            <Circle radius={0.025} />
            <Circle radius={0.018} />
            <Circle radius={0.01} />

            <Arrow />
          </group>
          <PilotContacts tilted={tilted} />
        </group>
      </Fragment>
    );
  }
);
const Pilot: FC<CardProps> = ({cardLoaded}) => {
  const {ship} = useClientData();
  const [tilted, setTilted] = useState(false);
  const [zoomValue, setZoomValue] = useState(100);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const client = useApolloClient();

  return (
    <div className="card-pilot h-full grid grid-cols-4 gap-4">
      <div>
        <Button onClick={() => setTilted(t => !t)}>Tilt</Button>

        <ZoomSlider
          value={zoomValue}
          setValue={setZoomValue}
          zoomMin={dimensions.width / (zoomMax * 2)}
          zoomMax={dimensions.width / (zoomMin * 2)}
          step={0.01}
        />
      </div>
      <div className="h-full col-start-2 col-end-4 flex items-center justify-center">
        <div className="h-full relative">
          <div className="absolute h-full w-full">
            <div className="absolute h-full w-full t-0 l-0 border-2 border-whiteAlpha-50 rounded-full bg-blackAlpha-500"></div>
            {cardLoaded && (
              <Canvas
                camera={{
                  position: [0, 100000, 0],
                  far: 200000,
                  zoom: 165,
                }}
                className="rounded-full"
                orthographic
              >
                <CameraEffects
                  zoomValue={zoomValue}
                  setDimensions={setDimensions}
                />
                <Suspense fallback={null}>
                  <ApolloProvider client={client}>
                    <CircleGrid tilted={tilted} playerShipId={ship.id} />
                  </ApolloProvider>
                </Suspense>
              </Canvas>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="100"
            width="100"
            className="h-full w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Pilot;
