import {useSpring} from "@react-spring/web";
import {useContextBridge} from "@react-three/drei";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {useQueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useWheel} from "@use-gesture/react";
import {ThoriumContext, useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {logslider} from "client/src/utils/logSlider";
import {ReactNode, useEffect, useRef, Suspense} from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {Group, OrthographicCamera} from "three";
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

  const circleGroup = useRef<Group>(null);
  const tiltRef = useRef(0);
  useSpring({
    tilt,
    onChange: ({value}) => (tiltRef.current = value.tilt),
  });

  const playerShipId = useNetRequest("playerShipId");
  const {interpolate} = useThorium();
  useFrame(props => {
    const playerShip = interpolate(playerShipId);

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
        <Suspense fallback={null}>
          <PilotContacts />
        </Suspense>
      </group>
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

  return null;
}
