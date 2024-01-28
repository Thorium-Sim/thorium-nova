import {q} from "@client/context/AppContext";
import {toast} from "@client/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import {useContext, useReducer} from "react";
import {useParams} from "@remix-run/react";
import {ShipPluginIdContext} from "@client/context/ShipSystemOverrideContext";
import {OverrideResetButton} from "../OverrideResetButton";
import {Navigate} from "@client/components/Navigate";

export default function ReactorsConfig() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.reactor.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
  const key = `${systemId}${rekey}`;
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2 flex items-start">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Optimal Output Percent"
              placeholder={"0.7"}
              helperText={
                "The percent of the possible reactor output that provides the highest fuel-to-energy conversion."
              }
              defaultValue={system.optimalOutputPercent}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.reactor.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    optimalOutputPercent: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing optimal output percent",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="optimalOutputPercent"
              setRekey={setRekey}
              className="mt-6"
            />
            <InfoTip>
              <p className="mb-2">
                If the optimal output percent is set to 0.7 (70%) and the
                reactor is set to run at 100% output, it will produce more
                energy, but consume fuel at about 1.5x per unit of power
                produced.
              </p>
              <p className="mb-2">
                Likewise, if the reactor is producing 50% of the possible power,
                it would only consume 0.7x the fuel per unit of power produced,
                which would make the fuel last longer.
              </p>
              <p className="mb-2">
                This value is the default setting for the reactors.
              </p>
            </InfoTip>
          </div>
          <div className="pb-2 flex items-start">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Number of Reactors"
              placeholder={"0.5"}
              helperText={
                "How many reactors will be created when this system is spawned on a ship."
              }
              defaultValue={system.reactorCount}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.reactor.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    reactorCount: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing reactor count",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="reactorCount"
              setRekey={setRekey}
              className="mt-6"
            />
            <InfoTip>
              <p className="mb-2">
                Reactor's power output is automatically determined when a flight
                starts based on the power requirements of the systems associated
                with the ship. Adding more reactors allows each to have
                different power outputs, changes in heat, efficiency, damage,
                etc. and provides some degree of redundancy.
              </p>
            </InfoTip>
          </div>
          <div className="pb-2 flex items-start">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Power Multiplier"
              placeholder={"1"}
              helperText={
                "Determines the total output of all reactors by multiplying this value by the default power for all ship systems."
              }
              defaultValue={system.powerMultiplier}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.reactor.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    powerMultiplier: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing power multiplier",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="powerMultiplier"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
