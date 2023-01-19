import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useEffect, useRef} from "react";
import {
  StarmapStoreProvider,
  useCalculateVerticalDistance,
  useGetStarmapStore,
} from "client/src/components/Starmap/starmapStore";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {SolarSystemMap} from "client/src/components/Starmap/SolarSystemMap";
import {Planet} from "client/src/components/Starmap/Planet";
import StarEntity from "client/src/components/Starmap/Star";
import {StarmapShip} from "../../components/Starmap/StarmapShip";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import Input from "@thorium/ui/Input";
import {StarmapCoreContextMenu} from "./StarmapCoreContextMenu";
import {WaypointEntity} from "client/src/cards/Pilot/Waypoint";
import useDragSelect, {
  DragSelection,
  get3dSelectedObjects,
} from "client/src/hooks/useDragSelect";
import {PerspectiveCamera, Vector3} from "three";
import {FaArrowLeft} from "react-icons/fa";
import {GiTargeted} from "react-icons/gi";
import Button from "@thorium/ui/Button";
import {useCancelFollow} from "client/src/components/Starmap/useCancelFollow";
import {useFollowEntity} from "client/src/components/Starmap/useFollowEntity";
import {ZoomSliderComp} from "client/src/cards/Navigation/MapControls";
import {TbPlanet, TbPlanetOff} from "react-icons/tb";
import {Coordinates} from "server/src/utils/unitTypes";
import {q} from "@client/context/AppContext";
import {useLiveQuery} from "@thorium/live-query/client";

export function StarmapCore() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="h-[calc(100%-2rem)] relative" ref={ref}>
      <StarmapStoreProvider>
        <StarmapCoreContextMenu parentRef={ref} />
        <div className="border-b border-b-white/20 pb-0.5 px-2 flex gap-2 items-baseline">
          <StarmapCoreMenubar />
        </div>
        <CanvasWrapper />
        <div className="absolute left-4 bottom-4 w-96">
          <ZoomSliderComp />
        </div>
      </StarmapStoreProvider>
    </div>
  );
}

function StarmapCoreMenubar() {
  const useStarmapStore = useGetStarmapStore();
  const [playerShips] = q.ship.players.useNetRequest();

  const playerShip = playerShips[0];
  useEffect(() => {
    useStarmapStore.setState({
      followEntityId: playerShip.id,
      selectedObjectIds: [playerShip.id],
      currentSystem: playerShip.currentSystem,
    });
  }, [playerShip.id, playerShip.currentSystem, useStarmapStore]);
  const inSystem = useStarmapStore(store => !!store.currentSystem);
  const yDimension = useStarmapStore(store => store.yDimensionIndex);
  const selectedSpawn = useStarmapStore(store => store.spawnShipTemplate);
  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);
  const followEntityId = useStarmapStore(store => store.followEntityId);
  const planetsHidden = useStarmapStore(store => store.planetsHidden);
  return (
    <>
      {inSystem && (
        <Button
          title="Return to Interstellar"
          className="btn-xs"
          onClick={() => useStarmapStore.getState().setCurrentSystem(null)}
        >
          <FaArrowLeft />
        </Button>
      )}
      <SearchableInput<{
        id: string;
        pluginName: string;
        name: string;
        category: string;
        vanity: string;
      }>
        inputClassName="input-sm"
        queryKey="spawn"
        getOptions={async ({queryKey, signal}) => {
          const result = await q.starmapCore.spawnSearch.netRequest(
            {query: queryKey[1]},
            {signal}
          );
          return result;
        }}
        ResultLabel={({active, result, selected}) => (
          <DefaultResultLabel active={active} selected={selected}>
            <div className="flex gap-4">
              <img src={result.vanity} alt="" className="w-8 h-8" />
              <div>
                <p className="m-0 leading-none">{result.name}</p>
                <p className="m-0 leading-none">
                  <small>{result.category}</small>
                </p>
              </div>
            </div>
          </DefaultResultLabel>
        )}
        setSelected={item =>
          useStarmapStore.setState({spawnShipTemplate: item})
        }
        selected={selectedSpawn}
        placeholder="Ship Spawn Search..."
      />
      <Button
        title="Follow selected entity"
        disabled={selectedObjectIds.length === 0}
        className={`btn-xs ${
          selectedObjectIds.length === 0 ? "btn-disabled" : ""
        } ${followEntityId ? "btn-primary" : "btn-outline"}`}
        onClick={() => {
          const firstSelected = selectedObjectIds[0];
          if (typeof firstSelected === "number") {
            useStarmapStore.setState(state => ({
              followEntityId: state.followEntityId ? null : firstSelected,
            }));
          }
        }}
      >
        <GiTargeted />
      </Button>
      <Button
        title="Hide/Show Planets"
        className={`btn-xs btn-warning ${planetsHidden ? "" : "btn-outline"}`}
        onClick={() =>
          useStarmapStore.setState(state => ({
            planetsHidden: !state.planetsHidden,
          }))
        }
      >
        {planetsHidden ? <TbPlanet /> : <TbPlanetOff />}
      </Button>
      <Input
        className="input-sm"
        label="Y Dimension"
        title="Y Dimension"
        labelHidden
        placeholder="Y Dimension"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={yDimension}
        onBlur={e =>
          (e.target.value = (
            isNaN(Number(e.target.value)) ? 0 : Number(e.target.value)
          ).toString())
        }
        onChange={e =>
          useStarmapStore.setState({
            yDimensionIndex: isNaN(Number(e.target.value))
              ? 0
              : Number(e.target.value),
          })
        }
      />
    </>
  );
}

function StarmapCoreCanvasHooks() {
  useCancelFollow();
  useFollowEntity();
  useCalculateVerticalDistance();

  return null;
}

const startPoint = new Vector3();
const endPoint = new Vector3();

function CanvasWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);
  q.starmapCore.stream.useDataStream({systemId: currentSystem});
  const [starmapShips] = q.starmapCore.ships.useNetRequest({
    systemId: currentSystem,
  });
  const {interpolate} = useLiveQuery();

  const cameraRef = useRef<PerspectiveCamera>();

  const [dragRef, dragPosition, node] = useDragSelect<HTMLCanvasElement>({
    setSelectionBounds: ({x1, x2, y1, y2}) => {
      if (cameraRef.current) {
        const selectedObjectIds = get3dSelectedObjects(
          starmapShips.reduce(
            (acc: {id: number; position: Coordinates<number>}[], ship) => {
              const position = interpolate(ship.id);
              if (position) {
                return acc.concat({id: ship.id, position});
              }
              return acc;
            },
            []
          ),
          cameraRef.current,
          startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
          endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5)
        );
        useStarmapStore.setState({selectedObjectIds});
      }
    },
    onDragStart: () =>
      useStarmapStore.getState().setCameraControlsEnabled(false),
    onDragEnd: () => useStarmapStore.getState().setCameraControlsEnabled(true),
  });

  useEffect(() => {
    useStarmapStore.setState({viewingMode: "core"});
  }, [useStarmapStore]);
  return (
    <>
      <StarmapCanvas
        onCreated={({gl, camera}) => {
          dragRef(gl.domElement);
          cameraRef.current = camera as PerspectiveCamera;
        }}
      >
        <StarmapCoreCanvasHooks />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} />
        {currentSystem === null ? (
          <InterstellarWrapper />
        ) : (
          <SolarSystemWrapper />
        )}
      </StarmapCanvas>
      {dragPosition && <DragSelection {...dragPosition} className="top-8" />}
    </>
  );
}
export function InterstellarWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  const [starmapShips] = q.starmapCore.ships.useNetRequest({
    systemId: currentSystem,
  });
  const [starmapSystems] = q.starmapCore.systems.useNetRequest();

  return (
    <InterstellarMap>
      {starmapSystems.map(sys =>
        sys.components.position && sys.components.identity ? (
          <SystemMarker
            key={sys.id}
            systemId={sys.id}
            position={
              [
                sys.components.position.x,
                sys.components.position.y,
                sys.components.position.z,
              ] as [number, number, number]
            }
            name={sys.components.identity.name}
            onClick={() => {
              useStarmapStore.setState({selectedObjectIds: [sys.id]});

              if (sys.components.position) {
                useStarmapStore
                  .getState()
                  .setCameraFocus(sys.components.position);
              }
            }}
            onDoubleClick={() =>
              useStarmapStore.getState().setCurrentSystem(sys.id)
            }
          />
        ) : null
      )}
      {starmapShips.map(ship => (
        <Suspense key={ship.id} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <StarmapShip {...ship} />
          </ErrorBoundary>
        </Suspense>
      ))}
    </InterstellarMap>
  );
}

export function SolarSystemWrapper() {
  const useStarmapStore = useGetStarmapStore();
  const currentSystem = useStarmapStore(store => store.currentSystem);

  if (currentSystem === null) throw new Error("No current system");
  const [system] = q.starmapCore.system.useNetRequest({
    systemId: currentSystem,
  });
  const [starmapEntities] = q.starmapCore.entities.useNetRequest({
    systemId: currentSystem,
  });
  const [starmapShips] = q.starmapCore.ships.useNetRequest({
    systemId: currentSystem,
  });
  const [waypoints] = q.waypoints.all.useNetRequest({
    systemId: "all",
  });

  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);
  const planetsHidden = useStarmapStore(store => store.planetsHidden);
  const isCore = useStarmapStore(store => store.viewingMode === "core");

  const {interpolate} = useLiveQuery();
  return (
    <SolarSystemMap
      skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}
    >
      {starmapEntities.map(entity => {
        if (planetsHidden) return null;
        if (entity.components.isStar) {
          if (!entity.components.satellite) return null;
          return (
            <Suspense key={entity.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <StarEntity
                  star={{
                    id: entity.id,
                    hue: entity.components.isStar.hue,
                    isWhite: entity.components.isStar.isWhite,
                    radius: entity.components.isStar.radius,
                    satellite: entity.components.satellite,
                  }}
                />
              </ErrorBoundary>
            </Suspense>
          );
        }
        if (entity.components.isPlanet) {
          if (!entity.components.satellite) return null;

          return (
            <Suspense key={entity.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <Planet
                  planet={{
                    id: entity.id,
                    satellite: entity.components.satellite,
                    isPlanet: entity.components.isPlanet,
                    name: entity.components.identity?.name || "",
                  }}
                />
              </ErrorBoundary>
            </Suspense>
          );
        }

        return null;
      })}
      {isCore
        ? null
        : waypoints.map(waypoint => (
            <WaypointEntity key={waypoint.id} waypoint={waypoint} viewscreen />
          ))}
      {starmapShips.map(ship => (
        <Suspense key={ship.id} fallback={null}>
          <ErrorBoundary
            FallbackComponent={() => <></>}
            onError={err => console.error(err)}
          >
            <StarmapShip
              {...ship}
              // TODO September 10, 2022 - This should use the faction color, or display the color scheme the flight director chooses
              spriteColor={
                selectedObjectIds.includes(ship.id) ? "#0088ff" : "white"
              }
              onClick={() => {
                const position = interpolate(ship.id);
                if (position) {
                  useStarmapStore.getState().setCameraFocus(position);
                }
                // TODO September 13, 2022 - Support shift/meta clicking to add or remove the ship from the selected objects list.
                useStarmapStore.setState({
                  selectedObjectIds: [ship.id],
                  followEntityId: ship.id,
                });
              }}
            />
          </ErrorBoundary>
        </Suspense>
      ))}
    </SolarSystemMap>
  );
}
