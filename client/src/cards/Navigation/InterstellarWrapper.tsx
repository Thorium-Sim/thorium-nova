import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useNetRequest} from "client/src/context/useNetRequest";
import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import {useEffect} from "react";

export function InterstellarWrapper() {
  const useStarmapStore = useGetStarmapStore();
  // This netRequest comes from the starmap core.
  const starmapSystems = useNetRequest("starmapSystems");

  useEffect(() => {
    useStarmapStore.getState().currentSystemSet?.(null);
  }, []);
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
            onClick={() => useStarmapStore.setState({selectedObjectId: sys.id})}
            onDoubleClick={() =>
              useStarmapStore.getState().setCurrentSystem(sys.id)
            }
          />
        ) : null
      )}
    </InterstellarMap>
  );
}
