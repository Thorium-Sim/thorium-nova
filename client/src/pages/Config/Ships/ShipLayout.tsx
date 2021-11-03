import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {SettingsList} from "./SettingsList";
import {netSend} from "client/src/context/netSend";

export const ShipLayout = () => {
  const {pathname} = useLocation();
  const {shipId, pluginId} = useParams() as {shipId: string; pluginId: string};
  const navigate = useNavigate();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const data = useNetRequest("pluginShip", {pluginId, shipId});
  if (!shipId || !data) return <Navigate to={`/config/${pluginId}/ships`} />;
  if (
    pathname.endsWith("/basic") ||
    pathname.endsWith("/assets") ||
    pathname.endsWith("/physics") ||
    pathname.endsWith("/systems")
  ) {
    return (
      <>
        <div>
          <SettingsList />
          <Button
            className="w-full btn-outline btn-error"
            disabled={!shipId}
            onClick={async () => {
              if (
                !shipId ||
                !(await confirm({
                  header: "Are you sure you want to delete this ship?",
                  body: "All content for this ship, including images and other assets, will be gone forever.",
                }))
              )
                return;
              netSend("pluginShipDelete", {pluginId, shipId});
              navigate(`/config/${pluginId}/ships`);
            }}
          >
            Delete Ship
          </Button>
          <Button
            className="w-full btn-outline btn-alert"
            disabled={true}
            onClick={async () => {
              if (!pluginId) return;
              const name = await prompt({
                header: "What is the name of the duplicated plugin?",
              });
              if (!name || typeof name !== "string") return;
              const {pluginId: duplicateId} = await netSend("pluginDuplicate", {
                pluginId: pluginId,
                name,
              });
              navigate(`/config/${duplicateId}`);
            }}
          >
            Duplicate Ship
          </Button>
        </div>
        <Outlet />
      </>
    );
  }
  return <Navigate to={`basic`} />;
};
