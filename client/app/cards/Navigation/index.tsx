import {
  StarmapStoreProvider,
  useCalculateVerticalDistance,
  useGetStarmapStore,
} from "@client/components/Starmap/starmapStore";
import {useEffect, useRef, useState, Suspense} from "react";
import StarmapCanvas from "@client/components/Starmap/StarmapCanvas";
import {CardProps} from "@client/routes/flight.station/CardProps";
import {MapControls} from "./MapControls";
import {InterstellarWrapper} from "./InterstellarWrapper";
import {SolarSystemWrapper} from "./SolarSystemWrapper";
import {ObjectDetails} from "./ObjectDetails";
import Button from "@thorium/ui/Button";
import {toast} from "@client/context/ToastContext";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import {capitalCase} from "change-case";
import {useSpring, a} from "@react-spring/web";
import SearchableList from "@thorium/ui/SearchableList";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useFollowEntity} from "@client/components/Starmap/useFollowEntity";
import {useCancelFollow} from "@client/components/Starmap/useCancelFollow";
import {q} from "@client/context/AppContext";
import {Icon} from "@thorium/ui/Icon";

export function Navigation(props: CardProps) {
  q.navigation.stream.useDataStream();
  return (
    <StarmapStoreProvider>
      <div className="mx-auto h-full bg-black/70 border border-white/50 relative">
        <Suspense fallback={<LoadingSpinner />}>
          <CanvasWrapper shouldRender={props.cardLoaded} />
        </Suspense>
        <div className="grid grid-cols-2 grid-rows-2 absolute inset-0 pointer-events-none p-4">
          <div className="max-w-sm">
            <StarmapSearch />
          </div>
          <div className="w-96 self-start justify-self-end max-h-min">
            <Suspense fallback={null}>
              <ObjectDetails />
              <div className="flex gap-4 w-full mt-2">
                <AddWaypoint />
                <EnterSystem />
              </div>
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
  const [waypoints] = q.waypoints.all.useNetRequest({systemId: "all"});
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
                    onClick={async e => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await q.waypoints.delete.netSend({waypointId: id});
                      } catch (err) {
                        if (err instanceof Error) {
                          toast({color: "error", title: err.message});
                        }
                      }
                    }}
                  >
                    <Icon name="ban" className="text-red-500" />
                  </button>
                )}
              </span>
            )}
            setSelectedItem={async ({id}) => {
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
                useStarmapStore.setState({
                  selectedObjectIds: waypoint.objectId
                    ? [waypoint.objectId]
                    : [],
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
  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);
  return (
    <Button
      className={`pointer-events-auto flex-1 btn-primary ${
        !selectedObjectIds ? "btn-disabled" : ""
      }`}
      disabled={selectedObjectIds.length === 0}
      onClick={async () => {
        try {
          typeof selectedObjectIds[0] === "number" &&
            (await q.waypoints.spawn.netSend({entityId: selectedObjectIds[0]}));
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

function EnterSystem() {
  const useStarmapStore = useGetStarmapStore();
  const [id] = useStarmapStore(store => store.selectedObjectIds);
  const [requestData] = q.navigation.object.useNetRequest({
    objectId: Number(id) || undefined,
  });
  const object = requestData.object;
  if (!object) return null;
  if (object.type !== "solarSystem") return null;

  return (
    <Button
      className={`pointer-events-auto flex-1 btn-warning ${
        !id ? "btn-disabled" : ""
      }`}
      disabled={!id}
      onClick={async () => {
        typeof id === "number" &&
          useStarmapStore.getState().setCurrentSystem(id);
        useStarmapStore.setState({selectedObjectIds: []});
      }}
    >
      Enter System
    </Button>
  );
}

function StarmapSearch() {
  const useStarmapStore = useGetStarmapStore();
  return (
    <SearchableInput<{id: number; name: string; type: string; position: any}>
      queryKey="nav"
      getOptions={async ({queryKey, signal}) => {
        const result = await q.navigation.search.netRequest(
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
        useStarmapStore.setState({selectedObjectIds: [item.id]});
        const controls = useStarmapStore.getState().cameraControls;
        controls?.current?.moveTo(
          item.position.x,
          item.position.y,
          item.position.z,
          true
        );
      }}
      placeholder="Search..."
      displayValue={item => item.name}
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
  }, [useStarmapStore]);

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
