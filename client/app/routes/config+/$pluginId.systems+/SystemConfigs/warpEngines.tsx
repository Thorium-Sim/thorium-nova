import {useParams} from "@remix-run/react";
import Input from "@thorium/ui/Input";
import {toast} from "@client/context/ToastContext";
import {useContext, useReducer} from "react";
import {ShipPluginIdContext} from "@client/context/ShipSystemOverrideContext";
import {OverrideResetButton} from "../OverrideResetButton";
import {q} from "@client/context/AppContext";
import {Navigate} from "@client/components/Navigate";

export default function WarpEngines() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.warp.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());

  const key = `${systemId}${rekey}`;
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  // TODO: May 3, 2022 - Add sound effects configuration here
  // TODO: May 3, 2022 - Figure out how to model the warp dynamo too
  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2 flex">
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
                  await q.plugin.systems.warp.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="interstellarCruisingSpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
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
                  await q.plugin.systems.warp.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="solarCruisingSpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
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
                  await q.plugin.systems.warp.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="minSpeedMultiplier"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
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
                  await q.plugin.systems.warp.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
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
            <OverrideResetButton
              property="warpFactorCount"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
