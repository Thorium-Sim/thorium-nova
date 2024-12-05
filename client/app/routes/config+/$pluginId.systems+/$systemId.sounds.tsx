import { q } from "@client/context/AppContext";
import { useContext, useReducer } from "react";
import { Link, Outlet, useParams } from "@remix-run/react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { Navigate } from "@client/components/Navigate";

export default function Sounds() {
	const { pluginId, systemId, shipId, sound } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
		sound: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});

	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	return (
		<>
			<div className="mb-2 w-72">
				<h3>Sound Effects</h3>
				{/* @ts-expect-error */}
				{Object.keys(system.soundEffects).map((key) => (
					<Link
						key={key}
						to={key}
						className={`list-group-item ${sound === key ? "selected" : ""}`}
					>
						{key}
					</Link>
				))}
			</div>
			<Outlet />
		</>
	);
}
