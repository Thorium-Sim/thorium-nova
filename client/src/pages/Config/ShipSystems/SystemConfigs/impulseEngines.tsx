import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";

export default function ImpulseEngineConfig() {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const system = useNetRequest("pluginShipSystem", {
    pluginId,
    type: "impulseEngines",
    systemId,
  }) as AllShipSystems["impulseEngines"];
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  // TODO: April 21, 2022 - Add sound effects configuration here
  return (
    <fieldset key={systemId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Cruising Speed"
              placeholder={"1500"}
              helperText={"In km/s"}
              defaultValue={system.cruisingSpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginImpulseEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    cruisingSpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing cruising speed",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
          <div className="pb-2">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Emergency Speed"
              placeholder={"2000"}
              helperText={"In km/s"}
              defaultValue={system.emergencySpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginImpulseEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    emergencySpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing emergency speed",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
          <div className="pb-2">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Thrust"
              placeholder={"12500"}
              helperText={
                "In Kilo-newtons. Affected by the mass of the ship the engines are attached to."
              }
              defaultValue={system.thrust}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginImpulseEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    thrust: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing thrust",
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
