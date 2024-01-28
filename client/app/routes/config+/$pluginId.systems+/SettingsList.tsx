import {q} from "@client/context/AppContext";
import {useContext} from "react";
import {useParams, Link, useLocation} from "@remix-run/react";
import {ShipPluginIdContext} from "@client/context/ShipSystemOverrideContext";

export function SettingsList() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const setting = useLocation().pathname.split("/").pop() || "";
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [availableShipSystems] = q.plugin.systems.available.useNetRequest();
  if (!system?.type) return null;
  const systemType = availableShipSystems.find(s => s.type === system.type);
  return (
    <div className="mb-2 w-72">
      {Object.entries(links).map(([key, value]) => {
        if (
          !["basic", "system"]
            .concat(systemType?.flags || [])
            .includes(key as any)
        )
          return null;
        return (
          <Link
            key={key}
            to={key}
            className={`list-group-item ${setting === key ? "selected" : ""}`}
          >
            {value}
          </Link>
        );
      })}
    </div>
  );
}
const links = {
  basic: "Basic",
  system: "System",
  power: "Power",
  heat: "Heat",
};
