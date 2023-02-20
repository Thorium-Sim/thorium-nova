import {Link, useMatch} from "react-router-dom";

const links = {
  basic: "Basic",
  physics: "Physics",
  assets: "Assets",
  shipMap: "Ship Map",
  systems: "Systems",
  cargo: "Cargo",
};

export function SettingsList() {
  const setting = useMatch("config/:pluginId/ships/:shipId/:setting")?.params
    .setting;
  return (
    <div className="mb-2 w-72 overflow-y-auto">
      {Object.entries(links).map(([key, value]) => (
        <Link
          key={key}
          to={key}
          className={`list-group-item ${setting === key ? "selected" : ""}`}
        >
          {value}
        </Link>
      ))}
    </div>
  );
}
