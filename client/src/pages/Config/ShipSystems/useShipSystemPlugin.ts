import {useNetRequest} from "client/src/context/useNetRequest";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";

export function useShipSystemPlugin<T extends keyof AllShipSystems>(
  pluginId: string,
  systemId: string,
  type: T
): AllShipSystems[T] {
  const data = useNetRequest("pluginShipSystem", {pluginId, systemId, type});

  return data as AllShipSystems[T];
}
