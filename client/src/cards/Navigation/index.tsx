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
import {ObjectDetails} from "./ObjectDetails";
import Button from "@thorium/ui/Button";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {useDataStream} from "client/src/context/useDataStream";

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
            className="pointer-events-auto max-w-sm"
          />
          <div className="w-96 self-start justify-self-end max-h-min">
            <ObjectDetails />
            <AddWaypoint />{" "}
          </div>
          <MapControls />
        </div>
      </div>
    </StarmapStoreProvider>
  );
}

function AddWaypoint() {
  const useStarmapStore = useGetStarmapStore();
  const selectedObjectId = useStarmapStore(store => store.selectedObjectId);
  return (
    <Button
      className={`pointer-events-auto w-full mt-2 btn-primary ${
        !selectedObjectId ? "btn-disabled" : ""
      }`}
      disabled={!selectedObjectId}
      onClick={async () => {
        try {
          typeof selectedObjectId === "number" &&
            (await netSend("waypointSpawn", {entityId: selectedObjectId}));
        } catch (error: unknown) {
          if (error instanceof Error) {
            toast({title: error.message, color: "error"});
          }
        }
      }}
    >
      Add Waypoint
    </Button>
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
  useCalculateVerticalDistance();
  return null;
}
