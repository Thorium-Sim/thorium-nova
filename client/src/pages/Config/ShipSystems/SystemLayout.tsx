import Button from "@thorium/ui/Button";
import {Outlet, useParams, useNavigate} from "react-router-dom";
import {useConfirm} from "@thorium/ui/AlertDialog";
import {Navigate, useLocation} from "react-router-dom";
import {SettingsList} from "./SettingsList";
import {q} from "@client/context/AppContext";

export const SystemLayout = () => {
  const {pathname} = useLocation();
  const {systemId, pluginId} = useParams() as {
    systemId: string;
    pluginId: string;
  };
  const navigate = useNavigate();
  const confirm = useConfirm();
  const data = q.plugin.systems.get.useNetRequest({pluginId, systemId});
  if (!systemId || !data)
    return <Navigate to={`/config/${pluginId}/systems`} />;

  if (decodeURI(pathname).endsWith(systemId)) return <Navigate to={`basic`} />;

  return (
    <>
      <div>
        <SettingsList />
        <Button
          className="w-full btn-outline btn-error btn-sm"
          disabled={!systemId}
          onClick={async () => {
            if (
              !systemId ||
              !(await confirm({
                header: "Are you sure you want to delete this system?",
                body: "All content for this system, including images and other assets, will be gone forever.",
              }))
            )
              return;
            q.plugin.systems.delete.netSend({
              pluginId,
              shipSystemId: systemId,
            });
            navigate(`/config/${pluginId}/systems`);
          }}
        >
          Delete System
        </Button>
        {/* <Button
                  className="w-full btn-outline btn-notice"
                  disabled={true}
                  onClick={async () => {
                    if (!pluginId) return;
                    const name = await prompt({
                      header: "What is the name of the duplicated plugin?",
                    });
                    if (!name || typeof name !== "string") return;
                    const result = await netSend("pluginShipDuplicate", {
                      pluginId: pluginId,
                      shipId,
                      name,
                    });
                    if ("error" in result) {
                      toast({title:"Error duplicating plugin", body: result.error, color:"error"});
                      return;
                    }
                    navigate(`/config/${result.shipId}`);
                  }}
                >
                  Duplicate Ship
                </Button> */}
      </div>
      <Outlet />
    </>
  );
};
