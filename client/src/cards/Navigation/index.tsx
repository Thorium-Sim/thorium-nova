import {
  StarmapStoreProvider,
  useCalculateVerticalDistance,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {useEffect, useRef, useState, Suspense} from "react";
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
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import {netRequest} from "client/src/context/useNetRequest";
import {capitalCase} from "change-case";
import {useSpring, a} from "@react-spring/web";
import SearchableList from "@thorium/ui/SearchableList";
import {useNetRequest} from "client/src/context/useNetRequest";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {FaBan} from "react-icons/fa";
export function Navigation(props: CardProps) {
  useDataStream();
  return (
    <StarmapStoreProvider>
      <div className="mx-auto h-full bg-black/70 border border-white/50 relative">
        <Suspense fallback={<LoadingSpinner />}>
          <CanvasWrapper shouldRender={props.cardLoaded} />
        </Suspense>
        <div className="grid grid-cols-2 grid-rows-2 absolute inset-0 pointer-events-none p-4">
          <div className="pointer-events-auto max-w-sm">
            <StarmapSearch />
          </div>
          <div className="w-96 self-start justify-self-end max-h-min">
            <Suspense fallback={null}>
              <ObjectDetails />
              <AddWaypoint />{" "}
            </Suspense>
          </div>
          <MapControls />
          <Suspense fallback={null}>
            <Waypoints />
          </Suspense>
        </div>
      </div>
    </StarmapStoreProvider>
  );
}

function Waypoints() {
  const useStarmapStore = useGetStarmapStore();
  const [style, animate] = useSpring(() => ({height: "0px"}), []);
  const [toggle, setToggle] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animate({
      height: (toggle ? 250 : 0) + "px",
    });
  }, [animate, ref, toggle]);
  const waypoints = useNetRequest("waypoints", {systemId: "all"});
  return (
    <div className="self-end justify-self-end w-96 pointer-events-auto">
      <Button className="btn-primary w-full" onClick={() => setToggle(t => !t)}>
        {toggle ? "Hide" : "Show"} Waypoints
      </Button>
      <a.div
        className="overflow-hidden w-full mt-2"
        style={{
          ...style,
        }}
      >
        <div ref={ref} className="flex flex-col h-full">
          <SearchableList
            items={
              waypoints.length === 0
                ? [{id: -1, label: "No waypoints set."}]
                : waypoints.map(w => ({
                    id: w.id,
                    label: w.name,
                  }))
            }
            renderItem={({id, label}) => (
              <span className="flex">
                <span className="flex-1">{label}</span>
                {/* TODO Aug 1 2022 - Add some method for marking waypoints as non-deletable for mission purposes. */}
                {id > -1 && (
                  <button
                    className="appearance-none"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      netSend("waypointDelete", {waypointId: id});
                    }}
                  >
                    <FaBan className="text-red-500" />
                  </button>
                )}
              </span>
            )}
            setSelectedItem={async id => {
              const waypoint = waypoints.find(w => w.id === id);
              if (waypoint) {
                if (
                  useStarmapStore.getState().currentSystem !==
                  waypoint?.position.parentId
                ) {
                  await useStarmapStore
                    .getState()
                    .setCurrentSystem(waypoint?.position.parentId);
                }
                console.log(waypoint);
                useStarmapStore.setState({
                  selectedObjectId: waypoint.objectId || null,
                });
                const controls = useStarmapStore.getState().cameraControls;
                controls?.current?.moveTo(
                  waypoint.position.x,
                  waypoint.position.y,
                  waypoint.position.z,
                  true
                );
              }
            }}
          />
        </div>
      </a.div>
    </div>
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
  useCalculateVerticalDistance();
  return null;
}
