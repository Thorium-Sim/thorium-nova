import Input from "@thorium/ui/Input";
import SearchableList from "@thorium/ui/SearchableList";
import {capitalCase} from "change-case";
import {useNetRequest} from "client/src/context/useNetRequest";
import * as React from "react";
import {useFlightQuickStart} from "./FlightQuickStartContext";

const ShipConfig = () => {
  const [state, dispatch] = useFlightQuickStart();

  const startingPoints = useNetRequest("availableStartingPoints");

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

  return (
    <div className="h-64 flex flex-col w-64">
      <SearchableList
        selectedItem={state.startingPointId}
        setSelectedItem={item =>
          dispatch({type: "startingPointId", startingPointId: item})
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
            <p>{item.description}</p>
          </div>
        )}
      />
    </div>
  );
};

export default ShipConfig;