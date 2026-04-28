import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import {
	ShipSystemOverrideContext,
	ShipPluginIdContext,
} from "@thorium/context/ShipSystemOverrideContext";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import Modal from "@thorium/ui/Modal";
import { Suspense, useContext } from "react";
import { useNavigate, useParams, useLocation, Outlet } from "react-router";

import { SettingsList } from "../../systems/SettingsList";

export default function OverrideEdit() {
	const {
		systemId,
		shipId,
		pluginId: systemPluginId,
	} = useParams() as {
		systemId: string;
		shipId: string;
		pluginId: string;
	};
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const pluginId = useContext(ShipPluginIdContext);
	const [ship] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	const overrides =
		ship.shipSystems.find((s) => s.systemId === systemId && s.pluginId === systemPluginId)
			?.overrides || {};

	if (decodeURI(pathname).endsWith(systemId)) return <Navigate to={`basic`} />;

	return (
		<Modal isOpen={true} setIsOpen={() => navigate("..")} title="Override System">
			<Suspense fallback={<LoadingSpinner />}>
				<ShipSystemOverrideContext.Provider value={overrides}>
					<div className="mt-8 flex min-h-[320px] w-[48rem] gap-8">
						<SettingsList />
						<Outlet />
					</div>
				</ShipSystemOverrideContext.Provider>
			</Suspense>
		</Modal>
	);
}
