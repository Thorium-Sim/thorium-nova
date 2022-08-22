import {useSpring} from "@react-spring/web";
import {Line, useContextBridge, useGLTF, useTexture} from "@react-three/drei";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {useQueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useWheel} from "@use-gesture/react";
import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {ThoriumContext, useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {logslider} from "client/src/utils/logSlider";
import {
  ReactNode,
  useEffect,
  useRef,
  Suspense,
  memo,
  useMemo,
  Fragment,
} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {IsPlanetComponent, IsStarComponent} from "server/src/components/list";
import type {SatelliteComponent} from "server/src/components/satellite";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import {degToRad, solarRadiusToKilometers} from "server/src/utils/unitTypes";
import {
  BufferAttribute,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Plane,
  Quaternion,
  RingBufferGeometry,
  Sprite,
  Vector3,
} from "three";
import {Line2} from "three-stdlib";
import {
  cameraQuaternionMultiplier,
  forwardQuaternion,
  zoomMax,
  zoomMin,
} from "./constants";
import {DistanceCircle} from "./DistanceCircle";
import {PlayerArrow} from "./PlayerArrow";
import {usePilotStore} from "./usePilotStore";

const CameraEffects = () => {
  const {camera, size} = useThree();
  useEffect(() => {
    usePilotStore.setState({
      width: size.width,
      height: size.height,
    });
  }, [size]);

  const zoom = usePilotStore(store => store.zoom);
  useEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);
  return null;
};

export function CircleGrid() {
  const tilt = usePilotStore(store => store.tilt);
  const useStarmapStore = useGetStarmapStore();

  const circleGroup = useRef<Group>(null);
  const tiltRef = useRef(0);
  useSpring({
    tilt,
    onChange: ({value}) => (tiltRef.current = value.tilt),
  });

  const {id, currentSystem} = useNetRequest("pilotPlayerShip");

  useEffect(() => {
    useStarmapStore.getState().setCurrentSystem(currentSystem);
  }, [currentSystem, useStarmapStore]);
  const {interpolate} = useThorium();
  useFrame(props => {
    const playerShip = interpolate(id);

    if (playerShip && circleGroup.current) {
      const {r} = playerShip;
      circleGroup.current.position.set(0, 0, 0);
      circleGroup.current.quaternion
        .set(r.x, r.y, r.z, r.w)
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

      camera.quaternion.set(r.x, r.y, r.z, r.w);
      camera.rotateX(-Math.PI / 2 - (Math.PI / 2) * tiltRef.current);
      camera.rotateZ(Math.PI);
    }
  });

  return (
    <group rotation={[0, 0, 0]}>
      <group ref={circleGroup}>
        <DistanceCircle radius={10000} />
        <DistanceCircle radius={7500} />
        <DistanceCircle radius={5000} />
        <DistanceCircle radius={2500} />
        <DistanceCircle radius={1800} />
        <DistanceCircle radius={1000} />
        <DistanceCircle radius={750} />
        <DistanceCircle radius={500} />
        <DistanceCircle radius={250} />
        <DistanceCircle radius={180} />
        <DistanceCircle radius={100} />
        <DistanceCircle radius={75} />
        <DistanceCircle radius={50} />
        <DistanceCircle radius={25} />
        <DistanceCircle radius={18} />
        <DistanceCircle radius={10} />
        <DistanceCircle radius={7.5} />
        <DistanceCircle radius={5.0} />
        <DistanceCircle radius={2.5} />
        <DistanceCircle radius={1.8} />
        <DistanceCircle />
        <DistanceCircle radius={0.75} />
        <DistanceCircle radius={0.5} />
        <DistanceCircle radius={0.25} />
        <DistanceCircle radius={0.18} />
        <DistanceCircle radius={0.1} />
        <DistanceCircle radius={0.075} />
        <DistanceCircle radius={0.05} />
        <DistanceCircle radius={0.025} />
        <DistanceCircle radius={0.018} />
        <DistanceCircle radius={0.01} />

        <PlayerArrow />
      </group>
      <Suspense fallback={null}>
        <PilotContacts />
      </Suspense>
    </group>
  );
}
export function GridCanvas({
  shouldRender,
  children,
}: {
  shouldRender: boolean;
  children: ReactNode;
}) {
  const client = useQueryClient();

  const ContextBridge = useContextBridge(
    ThoriumContext,
    UNSAFE_LocationContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext
  );

  const wheelBind = useWheel(({delta: [x, y]}) => {
    usePilotStore.setState(store => {
      const v = store.zoom;
      const {width} = usePilotStore.getState();
      const min = width / (zoomMax * 2);
      const max = width / (zoomMin * 2);
      const val = logslider(min, max, v, true) + y / 100;
      const output = Math.max(min, Math.min(max, logslider(min, max, val)));
      return {zoom: output};
    });
  });

  return (
    <div
      className="h-full w-full aspect-square border-2 border-white/50 rounded-full bg-black/50"
      {...wheelBind()}
    >
      <Canvas
        camera={{
          // position: [0, 300000, 0],
          far: 200000,
          zoom: 165,
        }}
        className="rounded-full"
        orthographic
        frameloop={shouldRender ? "always" : "demand"}
        gl={{antialias: true, logarithmicDepthBuffer: true}}
        onContextMenu={e => {
          e.preventDefault();
        }}
      >
        <CameraEffects />
        <ContextBridge>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </ContextBridge>
      </Canvas>
    </div>
  );
}

function PilotContacts() {
  const tilted = usePilotStore(store => store.tilt > 0);
  const useStarmapStore = useGetStarmapStore();
  const systemId = useStarmapStore(store => store.currentSystem);
  const orbs = useNetRequest("starmapSystemEntities", {
    systemId: systemId || undefined,
  });
  const ships = useNetRequest("starmapShips", {systemId});

  return (
    <group>
      {orbs.map(entity => {
        const {satellite, isPlanet, isStar} = entity.components;
        if (!satellite) return null;
        return (
          <PlanetaryEntity
            key={entity.id}
            satellite={satellite}
            isPlanet={isPlanet}
            isStar={isStar}
          />
        );
      })}
      {ships.map(({id, modelUrl, logoUrl, size}) => {
        if (!modelUrl || !logoUrl) return null;
        return (
          <Suspense key={id} fallback={null}>
            <ErrorBoundary FallbackComponent={fallback} onError={onError}>
              <ShipEntity
                id={id}
                modelUrl={modelUrl}
                logoUrl={logoUrl}
                size={size}
                tilted={tilted}
              />
            </ErrorBoundary>
          </Suspense>
        );
      })}
    </group>
  );
}

const onError = (err: Error) => console.error(err);
const fallback = () => <Fragment></Fragment>;

const zeroVector = new Vector3();
const upVector = new Vector3(0, 1, 0);
const playerQuaternion = new Quaternion();
const plane = new Plane();
export const ShipEntity = ({
  id,
  modelUrl,
  logoUrl,
  size,
  tilted,
}: {
  id: number;
  modelUrl: string;
  logoUrl: string;
  size: number;
  tilted?: boolean;
}) => {
  console.log(size);
  const {id: playerId} = useNetRequest("pilotPlayerShip");
  // TODO: Use useGLTF.preload outside of this to preload the asset
  const model = useGLTF(modelUrl || "", false);

  const scene = useMemo(() => {
    const scene: Object3D = model.scene.clone(true);
    if (scene.traverse) {
      scene.traverse(function (object: Object3D | Mesh) {
        if ("material" in object) {
          object.material = new MeshBasicMaterial({
            color: "white",
            wireframe: true,
          });
        }
      });
    }

    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl]);

  const {interpolate} = useThorium();

  const spriteMap = useTexture(logoUrl);
  const scale = 1 / 50;
  const mesh = useRef<Mesh>(null);
  const line = useRef<Line2>(null);
  const sprite = useRef<Sprite>(null);
  const shipRef = useRef<Group>(null);
  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    const ship = interpolate(id);
    const playerShip = interpolate(playerId);

    const playerPosition = playerShip || zeroVector;
    if (!ship || !playerPosition || !playerShip) return;
    if (shipRef.current) {
      if (size && dx / (size / 1000) < 50) {
        if (sprite.current) {
          sprite.current.visible = false;
        }
        shipRef.current.visible = true;
      } else {
        if (sprite.current) {
          sprite.current.visible = true;
        }
        shipRef.current.visible = false;
      }
    }
    if (ship) {
      // Since the sensor grid needs to be oriented at 0,0,0
      // to properly tilt, we reposition the contacts relative
      // to the player ship's position.
      sprite.current?.position.set(
        ship.x - playerPosition.x,
        ship.y - playerPosition.y,
        ship.z - playerPosition.z
      );
      if (sprite.current?.position) {
        shipRef.current?.position.copy(sprite.current?.position);
      }
      shipRef.current?.scale.setScalar(size / 1000 || 0.5);
      if (ship.r) {
        shipRef.current?.quaternion.set(ship.r.x, ship.r.y, ship.r.z, ship.r.w);
      }
      if (playerShip.r && sprite.current?.position && mesh.current?.position) {
        const planeVector = upVector
          .clone()
          .applyQuaternion(
            playerQuaternion.set(
              playerShip.r.x,
              playerShip.r.y,
              playerShip.r.z,
              playerShip.r.w
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
    if (playerShip.r) {
      mesh.current?.quaternion.set(
        playerShip.r.x,
        playerShip.r.y,
        playerShip.r.z,
        playerShip.r.w
      );
      mesh.current?.rotateX(Math.PI / 2);
    }
  });

  return (
    <Fragment>
      <group ref={shipRef}>
        <primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
      </group>
      {id !== playerId && (
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
            <meshBasicMaterial
              attach="material"
              color="white"
              side={DoubleSide}
            />
          </mesh>
        </Fragment>
      )}
    </Fragment>
  );
};

interface PlanetaryEntityProps {
  satellite: Omit<SatelliteComponent, "init">;
  isPlanet?: Omit<IsPlanetComponent, "init">;
  isStar?: Omit<IsStarComponent, "init">;
}

export const PlanetaryEntity = memo(
  ({satellite, isPlanet, isStar}: PlanetaryEntityProps) => {
    const {id: playerId} = useNetRequest("pilotPlayerShip");
    const {interpolate} = useThorium();

    const ref = useRef<Group>(null);
    useFrame(() => {
      const playerShip = interpolate(playerId);
      if (!playerShip || (!isPlanet && !isStar) || !satellite) return;
      const position = getOrbitPosition({
        semiMajorAxis: satellite.semiMajorAxis,
        eccentricity: satellite.eccentricity,
        orbitalArc: satellite.orbitalArc,
        inclination: satellite.inclination,
      });
      ref.current?.position.set(
        position.x - playerShip.x,
        position.y - playerShip.y,
        position.z - playerShip.z
      );
    });
    if ((!isPlanet && !isStar) || !satellite) return null;

    const size = isPlanet
      ? isPlanet.radius
      : isStar
      ? solarRadiusToKilometers(isStar.radius)
      : 0;

    return (
      <group
        ref={ref}
        scale={[size, size, size]}
        rotation={[0, 0, degToRad(satellite.axialTilt)]}
      >
        <mesh>
          <icosahedronBufferGeometry args={[1, 3]} attach="geometry" />
          <meshBasicMaterial wireframe color="white" attach="material" />
        </mesh>
        {isPlanet?.ringMapAsset && <BasicRings />}
      </group>
    );
  }
);

function BasicRings() {
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
}
