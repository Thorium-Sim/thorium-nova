import {q} from "@client/context/AppContext";
import Input from "@thorium/ui/Input";
import {useContext, useReducer} from "react";
import {Navigate, useParams} from "react-router-dom";
import {ShipPluginIdContext} from "../Ships/ShipSystemOverrideContext";
import {OverrideResetButton} from "./OverrideResetButton";

export function Heat() {
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());

  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const key = `${systemId}${rekey}`;
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });

  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Coolant Heat Transfer Rate"
              helperText="The rate at which heat can transfer from the system to coolant stored the room, in Kelvin / second."
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={system.coolantHeatTransferRate}
              onBlur={(e: any) => {
                if (isNaN(Number(e.target.value))) return;
                q.plugin.systems.update.netSend({
                  pluginId,
                  systemId: systemId,
                  shipId,
                  shipPluginId,
                  coolantHeatTransferRate: Number(e.target.value),
                });
              }}
            />
            <OverrideResetButton
              property="coolantHeatTransferRate"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Heat Dissipation Rate"
              helperText="A multiplier for the effectiveness of dissipating heat into space. Less than 1 = less effective, more than 1 = more effective."
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={system.heatDissipationRate}
              onBlur={(e: any) => {
                if (isNaN(Number(e.target.value))) return;
                q.plugin.systems.update.netSend({
                  pluginId,
                  systemId: systemId,
                  shipId,
                  shipPluginId,
                  heatDissipationRate: Number(e.target.value),
                });
              }}
            />
            <OverrideResetButton
              property="heatDissipationRate"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>

          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Nominal Heat"
              helperText="The standard heat level in Kelvin. When plotted in a heat bar, this level represents the bottom of the bar."
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={system.nominalHeat}
              onBlur={(e: any) => {
                if (isNaN(Number(e.target.value))) return;
                q.plugin.systems.update.netSend({
                  pluginId,
                  systemId: systemId,
                  shipId,
                  shipPluginId,
                  nominalHeat: Number(e.target.value),
                });
              }}
            />
            <OverrideResetButton
              property="nominalHeat"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>

          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Max Safe Heat"
              helperText="The temperature in Kelvin above which the system's efficiency starts decreasing due to overheating."
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={system.maxSafeHeat}
              onBlur={(e: any) => {
                if (isNaN(Number(e.target.value))) return;
                q.plugin.systems.update.netSend({
                  pluginId,
                  systemId: systemId,
                  shipId,
                  shipPluginId,
                  maxSafeHeat: Number(e.target.value),
                });
              }}
            />
            <OverrideResetButton
              property="maxSafeHeat"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>

          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Max Heat"
              helperText="The maximum possible temperature in Kelvin. Represents the top of the heat bar graph."
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={system.maxHeat}
              onBlur={(e: any) => {
                if (isNaN(Number(e.target.value))) return;
                q.plugin.systems.update.netSend({
                  pluginId,
                  systemId: systemId,
                  shipId,
                  shipPluginId,
                  maxHeat: Number(e.target.value),
                });
              }}
            />
            <OverrideResetButton
              property="maxHeat"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
