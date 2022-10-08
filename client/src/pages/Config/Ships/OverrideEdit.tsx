import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import Modal from "@thorium/ui/Modal";
import {SettingsList} from "../ShipSystems/SettingsList";
import {Basic} from "../ShipSystems/Basic";
import {Power} from "../ShipSystems/Power";
import {Efficiency} from "../ShipSystems/Efficiency";
import {Heat} from "../ShipSystems/Heat";
import {useNetRequest} from "client/src/context/useNetRequest";
import {systemConfigs} from "../ShipSystems";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {createContext, Suspense, useContext} from "react";
import {
  ShipSystemOverrideContext,
  ShipPluginIdContext,
} from "./ShipSystemOverrideContext";

const SystemConfig = () => {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const system = useNetRequest("pluginShipSystem", {pluginId, systemId});
  if (!system?.type) return null;
  const Comp = systemConfigs[system.type];
  if (!Comp) return null;
  return <Comp />;
};

export function OverrideEdit() {
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
  const ship = useNetRequest("pluginShip", {pluginId, shipId});
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
            <Routes>
              <Route path="basic" element={<Basic />} />
              <Route
                path="system"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <SystemConfig />
                  </Suspense>
                }
              />

              <Route path="power" element={<Power />} />
              <Route path="efficiency" element={<Efficiency />} />
              <Route path="heat" element={<Heat />} />
            </Routes>
          </div>
        </ShipSystemOverrideContext.Provider>
      </Suspense>
    </Modal>
  );
}
