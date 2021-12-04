import {Link, useMatch} from "react-router-dom";

export function SettingsList() {
  const match = useMatch("/config/:pluginId/ships/:shipId/:setting");
  return (
    <div className="mb-2 w-72">
      <Link
        to="basic"
        className={`list-group-item ${
          match?.params.setting === "basic" ? "selected" : ""
        }`}
      >
        Basic
      </Link>

      <Link
        to="physics"
        className={`list-group-item ${
          match?.params.setting === "physics" ? "selected" : ""
        }`}
      >
        Physics
      </Link>

      <Link
        to="assets"
        className={`list-group-item ${
          match?.params.setting === "assets" ? "selected" : ""
        }`}
      >
        Assets
      </Link>
      <Link
        to="systems"
        className={`list-group-item ${
          match?.params.setting === "systems" ? "selected" : ""
        }`}
      >
        Systems
      </Link>
    </div>
  );
}
