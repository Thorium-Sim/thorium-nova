import {useEffect} from "react";
import {useGetStarmapStore} from "./starmapStore";
import {useParams} from "react-router";
import {useMatch} from "react-router-dom";

export function useSystemIds() {
  const pluginId = useParams().pluginId;
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId;
  const useStarmapStore = useGetStarmapStore();

  if (!pluginId) throw new Error("Error determining plugin ID");
  if (!matchSystemId) throw new Error("Error determining solar system ID");
  useEffect(() => {
    if (useStarmapStore.getState().selectedObjectIds.length === 0) {
      useStarmapStore.setState({
        selectedObjectIds: [matchSystemId],
      });
    }
  }, [matchSystemId, useStarmapStore]);
  return [pluginId, matchSystemId] as const;
}
