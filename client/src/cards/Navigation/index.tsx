import {
  StarmapStoreProvider,
  useCalculateVerticalDistance,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {useEffect, useState} from "react";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import Input from "@thorium/ui/Input";
import {CardProps} from "client/src/components/Station/CardProps";
import {MapControls} from "./MapControls";
import {InterstellarWrapper} from "./InterstellarWrapper";
import {SolarSystemWrapper} from "./SolarSystemWrapper";
import {useDataStream} from "client/src/context/useDataStream";
import {useFollowEntity} from "client/src/components/Starmap/useFollowEntity";
import {useCancelFollow} from "../../components/Starmap/useCancelFollow";

export function Navigation(props: CardProps) {
  useDataStream();
  return (
    <StarmapStoreProvider>
      <div className="mx-auto h-full bg-black/70 border border-white/50 relative">
        <CanvasWrapper shouldRender={props.cardLoaded} />
        <div className="grid grid-cols-2 grid-rows-2 absolute inset-0 pointer-events-none p-4">
          <Input
            label="Search"
            labelHidden
            placeholder="Search..."
            className="pointer-events-all max-w-sm"
          />
          <div></div>
          <MapControls />
        </div>
      </div>
    </StarmapStoreProvider>
  );
}

function CanvasWrapper({shouldRender}: {shouldRender: boolean}) {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => {
    useStarmapStore.setState({viewingMode: "station", cameraView: "2d"});
    setFirstRender(false);
  }, []);

  return (
    <StarmapCanvas shouldRender={firstRender || shouldRender}>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <StarmapHooks />
      {currentSystem === null ? (
        <InterstellarWrapper />
      ) : (
        <SolarSystemWrapper />
      )}
    </StarmapCanvas>
  );
}

function StarmapHooks() {
  useCancelFollow();
  useFollowEntity();
  useCalculateVerticalDistance();
  return null;
}
