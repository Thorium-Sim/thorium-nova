import {useNetRequest} from "client/src/context/useNetRequest";
import {useParams} from "react-router-dom";
import {Link} from "react-router-dom";

export function SettingsList() {
  const params = useParams();
  const setting = params["*"]?.split("/")[1];
  const {pluginId, systemId} = params as {pluginId: string; systemId: string};
  const system = useNetRequest("pluginShipSystem", {pluginId, systemId});
  const availableShipSystems = useNetRequest("availableShipSystems");
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
  efficiency: "Efficiency",
  heat: "Heat",
};
