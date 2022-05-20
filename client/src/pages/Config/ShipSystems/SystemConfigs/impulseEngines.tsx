import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {useContext, useReducer} from "react";
import {ShipPluginIdContext} from "../../Ships/ShipSystemOverrideContext";
import {OverrideResetButton} from "../OverrideResetButton";

export default function ImpulseEngineConfig() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const system = useNetRequest("pluginShipSystem", {
    pluginId,
    type: "impulseEngines",
    systemId,
    shipId,
    shipPluginId,
  }) as AllShipSystems["impulseEngines"];
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
  const key = `${systemId}${rekey}`;
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  // TODO: April 21, 2022 - Add sound effects configuration here
  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2 flex">
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
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="cruisingSpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
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
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="emergencySpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
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
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="thrust"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
