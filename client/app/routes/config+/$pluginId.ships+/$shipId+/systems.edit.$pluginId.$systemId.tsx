import {useNavigate, useParams, useLocation, Outlet} from "@remix-run/react";
import Modal from "@thorium/ui/Modal";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {Suspense, useContext} from "react";
import {
  ShipSystemOverrideContext,
  ShipPluginIdContext,
} from "@client/context/ShipSystemOverrideContext";
import {q} from "@client/context/AppContext";
import {SettingsList} from "../../$pluginId.systems+/SettingsList";
import {Navigate} from "@client/components/Navigate";

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
  const {pathname} = useLocation();

  const pluginId = useContext(ShipPluginIdContext);
  const [ship] = q.plugin.ship.get.useNetRequest({pluginId, shipId});
  const overrides =
    ship.shipSystems.find(
      s => s.systemId === systemId && s.pluginId === systemPluginId
    )?.overrides || {};

  if (decodeURI(pathname).endsWith(systemId)) return <Navigate to={`basic`} />;

  return (
    <Modal
      isOpen={true}
      setIsOpen={() => navigate("..")}
      title="Override System"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ShipSystemOverrideContext.Provider value={overrides}>
          <div className="flex gap-8 mt-8 w-[48rem] min-h-[320px]">
            <SettingsList />
            <Outlet />
          </div>
        </ShipSystemOverrideContext.Provider>
      </Suspense>
    </Modal>
  );
}
