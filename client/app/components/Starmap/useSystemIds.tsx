import {useEffect} from "react";
import {useGetStarmapStore} from "./starmapStore";
import {useParams} from "@remix-run/react";

export function useSystemIds() {
  const {pluginId, systemId} = useParams();
  const useStarmapStore = useGetStarmapStore();
  useEffect(() => {
    if (!systemId) return;
    if (useStarmapStore.getState().selectedObjectIds.length === 0) {
      useStarmapStore.setState({
        selectedObjectIds: [systemId],
      });
    }
  }, [systemId, useStarmapStore]);
  return [pluginId, systemId] as [string, string];
}
