import {
  StarmapStoreProvider,
  useCalculateVerticalDistance,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {useEffect, useState} from "react";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {CardProps} from "client/src/components/Station/CardProps";
import {MapControls} from "./MapControls";
import {InterstellarWrapper} from "./InterstellarWrapper";
import {SolarSystemWrapper} from "./SolarSystemWrapper";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import {netRequest} from "client/src/context/useNetRequest";
import {capitalCase} from "change-case";
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
          <div className="pointer-events-auto max-w-sm">
            <StarmapSearch />
          </div>
          <div></div>
          <MapControls />
        </div>
      </div>
    </StarmapStoreProvider>
  );
}

function StarmapSearch() {
  const useStarmapStore = useGetStarmapStore();
  return (
    <SearchableInput<{id: number; name: string; type: string; position: any}>
      queryKey="nav"
      getOptions={async ({queryKey, signal}) => {
        const result = await netRequest(
          "navigationSearch",
          {query: queryKey[1]},
          {signal}
        );
        return result;
      }}
      ResultLabel={({active, result, selected}) => (
        <DefaultResultLabel active={active} selected={selected}>
          <p>{result.name}</p>
          <p>
            <small>
              {result.type === "solar"
                ? "Solar System"
                : capitalCase(result.type)}
            </small>
          </p>
        </DefaultResultLabel>
      )}
      setSelected={async item => {
        if (!item) return;
        if (
          useStarmapStore.getState().currentSystem !== item?.position.parentId
        ) {
          await useStarmapStore
            .getState()
            .setCurrentSystem(item?.position.parentId);
        }
        useStarmapStore.setState({selectedObjectId: item.id});
        const controls = useStarmapStore.getState().cameraControls;
        controls?.current?.moveTo(
          item.position.x,
          item.position.y,
          item.position.z,
          true
        );
      }}
      placeholder="Search..."
    />
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
