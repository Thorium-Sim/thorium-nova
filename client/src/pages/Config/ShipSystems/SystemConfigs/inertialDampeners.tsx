import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";

export default function InertialDampenersConfig() {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const system = useNetRequest("pluginShipSystem", {
    pluginId,
    type: "inertialDampeners",
    systemId,
  }) as AllShipSystems["inertialDampeners"];
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  return (
    <fieldset key={systemId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Dampening"
              placeholder={"1"}
              helperText={
                "Number > 0 that affects how fast the ship slows. Lower numbers slow the ship faster."
              }
              defaultValue={system.dampening}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginInertialDampenersUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    dampening: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing dampening",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
