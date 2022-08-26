import {useFrame} from "@react-three/fiber";
import Nebula from "client/src/components/Starmap/Nebula";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useThorium} from "client/src/context/ThoriumContext";
import {useDataStream} from "client/src/context/useDataStream";
import {useNetRequest} from "client/src/context/useNetRequest";
import {
  InterstellarWrapper,
  SolarSystemWrapper,
} from "client/src/cores/StarmapCore";
import {Suspense, useEffect} from "react";
import {Quaternion} from "three";
import {Fuzz} from "./Fuzz";
import {WarpStars} from "./WarpStars";

const forwardQuaternion = new Quaternion(0, 1, 0, 0);

function ViewscreenEffects() {
  const viewscreenSystem = useNetRequest("viewscreenSystem");
  const player = useNetRequest("pilotPlayerShip");
  const {interpolate} = useThorium();

  const useStarmapStore = useGetStarmapStore();
  useEffect(() => {
    useStarmapStore.getState().setCameraControlsEnabled(false);
  }, [useStarmapStore]);
  useEffect(() => {
    useStarmapStore.getState().setCurrentSystem(viewscreenSystem?.id || null);
  }, [viewscreenSystem?.id, useStarmapStore]);
  useEffect(() => {
    useStarmapStore.setState({
      skyboxKey: viewscreenSystem?.skyboxKey || "",
      viewingMode: "viewscreen",
    });
  }, [viewscreenSystem?.skyboxKey, useStarmapStore]);

  useFrame(({camera}) => {
    const position = interpolate(player.id);
    if (!position) return;

    camera.position.set(position.x, position.y, position.z);
    camera.quaternion
      .set(position.r.x, position.r.y, position.r.z, position.r.w)
      .multiply(forwardQuaternion);
  });

  return null;
}

export function Viewscreen() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  useDataStream();

  return (
    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
      <StarmapCanvas>
        <ViewscreenEffects />
        <pointLight
          intensity={0.2}
          decay={2}
          position={[10000000, 10000000, 1000000]}
        />
        <pointLight
          intensity={0.1}
          decay={2}
          position={[-10000000, -10000000, -1000000]}
        />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Fuzz />
        </Suspense>
        <Suspense fallback={null}>
          <WarpStars />
        </Suspense>
        <Suspense fallback={null}>
          <Nebula />
        </Suspense>
        {currentSystem === null ? (
          <InterstellarWrapper />
        ) : (
          <SolarSystemWrapper />
        )}
      </StarmapCanvas>
    </div>
  );
}
