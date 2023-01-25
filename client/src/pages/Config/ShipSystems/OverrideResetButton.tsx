import {useParams} from "react-router-dom";
import {useContext} from "react";
import {ShipPluginIdContext} from "../Ships/ShipSystemOverrideContext";
import {MdLoop} from "react-icons/md";
import Button from "@thorium/ui/Button";
import {q} from "@client/context/AppContext";

export function OverrideResetButton({
  property,
  setRekey,
  className = "",
}: {
  property: string;
  setRekey: () => void;
  className?: string;
}) {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  if (!shipPluginId) return null;
  return (
    <Button
      title="Reset override"
      onClick={async () => {
        await q.plugin.systems.restoreOverride.netSend({
          pluginId,
          systemId: systemId,
          shipId,
          shipPluginId,
          property,
        });
        setRekey();
      }}
      className={`btn-sm btn-warning btn-outline ${className}`}
    >
      <MdLoop />
    </Button>
  );
}
