import {q} from "@client/context/AppContext";
import SearchableList from "@thorium/ui/SearchableList";
import * as React from "react";
import {useFlightQuickStart} from "./FlightQuickStartContext";
import {cn} from "@client/utils/cn";

const ShipConfig = () => {
  const [state, dispatch] = useFlightQuickStart();

  const [missions] = q.plugin.timeline.missions.useNetRequest();
  const [startingPoints] = q.plugin.timeline.startingPoints.useNetRequest();

  const startingPoint = startingPoints.find(
    point =>
      point.pluginId === state.startingPointId?.pluginId &&
      point.objectId === state.startingPointId.objectId &&
      point.solarSystemId === state.startingPointId.solarSystemId
  );
  React.useEffect(() => {
    if (state.startingPointId) {
      if (!startingPoint) {
        dispatch({type: "startingPointId", startingPointId: undefined});
      }
    }
  }, [state.startingPointId, startingPoint, dispatch]);

  if (!startingPoints || startingPoints.length === 0)
    return <div>No starting points are present in the active plugins.</div>;

  const mission = missions.find(
    mission =>
      mission.pluginId === state.missionId?.pluginId &&
      mission.name === state.missionId.missionId
  );

  const isSandbox =
    state.missionId?.pluginId === "Thorium Default" &&
    state.missionId.missionId === "Sandbox";

  return (
    <div className="h-[70vh] grid grid-cols-3 grid-rows-[auto_1fr] w-[60vw] gap-8">
      <div className="row-span-2">
        <SearchableList
          selectedItem={state.missionId}
          setSelectedItem={({id}) =>
            dispatch({type: "missionId", missionId: id})
          }
          items={missions.map(item => ({
            id: {pluginId: item.pluginId, missionId: item.name},
            label: item.name,
            description: item.description,
            category: item.category,
            // image: item.vanityUrl,
          }))}
        />
      </div>
      <img
        src={mission?.cover}
        alt=""
        className={cn("shadow-xl rounded-lg", {"col-span-2": !isSandbox})}
      />
      <p
        className={cn(
          "text-xl flex-1 overflow-y-auto row-start-2 col-start-2",
          {
            "col-span-2": !isSandbox,
          }
        )}
      >
        {mission?.description}
      </p>
      {isSandbox ? (
        <>
          <div className="col-start-3 row-span-2">
            <p className="font-bold text-lg">Starting Point</p>
            <SearchableList
              selectedItem={state.startingPointId}
              setSelectedItem={({id}) =>
                dispatch({type: "startingPointId", startingPointId: id})
              }
              items={startingPoints.map(item => ({
                id: item,
                label: item.objectId,
                description: item.solarSystemId,
                category: item.pluginId,
                // image: item.vanityUrl,
              }))}
              renderItem={item => (
                <div>
                  {/* <img
              src={item.image}
              alt={item.label}
              className="float-left h-12 w-12 mr-2 bg-black/80 rounded-full"
            /> */}
                  <p className="font-bold">{item.label}</p>
                  <p className="text-sm">{item.description}</p>
                </div>
              )}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ShipConfig;
