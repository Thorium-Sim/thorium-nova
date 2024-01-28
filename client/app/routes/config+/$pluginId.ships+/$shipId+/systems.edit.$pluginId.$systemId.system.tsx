import {ShipPluginIdContext} from "@client/context/ShipSystemOverrideContext";
import {useParams} from "@remix-run/react";
import {useContext} from "react";
import {systemConfigs} from "../../$pluginId.systems+/$systemId.system";
import {q} from "@client/context/AppContext";

export default function SystemConfig() {
  const {systemId, shipId, pluginId} = useParams() as {
    systemId: string;
    shipId: string;
    pluginId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext)!;
  const [system] = q.plugin.systems.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  if (!system?.type) return null;
  const Comp = systemConfigs[system.type];
  if (!Comp) return null;
  return <Comp />;
}
