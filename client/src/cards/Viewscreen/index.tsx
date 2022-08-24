import Nebula from "client/src/components/Starmap/Nebula";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useDataStream} from "client/src/context/useDataStream";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Suspense, useEffect} from "react";
import {Fuzz} from "./Fuzz";
import {WarpStars} from "./WarpStars";

function ViewscreenEffects() {
  const viewscreenSystem = useNetRequest("viewscreenSystem");
  const useStarmapStore = useGetStarmapStore();

  useEffect(() => {
    useStarmapStore.getState().setCurrentSystem(viewscreenSystem?.id || null);
  }, [viewscreenSystem?.id, useStarmapStore]);
  useEffect(() => {
    useStarmapStore.setState({
      skyboxKey: viewscreenSystem?.skyboxKey || "",
      viewingMode: "viewscreen",
    });
  }, [viewscreenSystem?.skyboxKey, useStarmapStore]);
  return null;
}
export function Viewscreen() {
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
      </StarmapCanvas>
    </div>
  );
}
