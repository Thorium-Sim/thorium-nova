import {Link, useParams} from "react-router-dom";

const links = {
  basic: "Basic",
  physics: "Physics",
  assets: "Assets",
  shipMap: "Ship Map",
  systems: "Systems",
};

export function SettingsList() {
  const params = useParams();
  const setting = params["*"]?.split("/")[1];
  return (
    <div className="mb-2 w-72">
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
