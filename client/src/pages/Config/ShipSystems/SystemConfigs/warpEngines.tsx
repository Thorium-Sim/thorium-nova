import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";

export default function WarpEngines() {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const system = useNetRequest("pluginShipSystem", {
    pluginId,
    type: "warpEngines",
    systemId,
  }) as AllShipSystems["warpEngines"];
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  // TODO: May 3, 2022 - Add sound effects configuration here
  // TODO: May 3, 2022 - Figure out how to model the warp dynamo too
  return (
    <fieldset key={systemId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Interstellar Cruising Speed"
              placeholder={"599600000000"}
              helperText={"For traveling through interstellar space. In km/s"}
              defaultValue={system.interstellarCruisingSpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginWarpEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    interstellarCruisingSpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing interstellar cruising speed",
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
              label="Solar Cruising Speed"
              placeholder={"29980000"}
              helperText={"For traveling through solar system space. In km/s"}
              defaultValue={system.solarCruisingSpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginWarpEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    solarCruisingSpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing solar cruising speed",
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
              label="Minimum Speed Multiplier"
              placeholder={"0.01"}
              helperText={
                "The min speed (warp 1) compared to the cruising speed. Defaults to 0.01, should be less than 1."
              }
              defaultValue={system.minSpeedMultiplier}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginWarpEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    minSpeedMultiplier: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing minimum speed multiplier",
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
              label="Warp Factor Count"
              placeholder={"5"}
              helperText={
                "The number of warp factors available. Does not include emergency or destructive warp. Must be greater than 2"
              }
              defaultValue={system.warpFactorCount}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await netSend("pluginWarpEnginesUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    warpFactorCount: Math.round(Number(e.target.value)),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing warp factor count",
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
