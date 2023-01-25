import {Navigate, useParams} from "react-router-dom";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {toast} from "client/src/context/ToastContext";
import {useContext, useReducer} from "react";
import {ShipPluginIdContext} from "../../Ships/ShipSystemOverrideContext";
import {OverrideResetButton} from "../OverrideResetButton";
import {q} from "@client/context/AppContext";

export default function ThrustersConfig() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.thrusters.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
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
              label="Linear Max Speed"
              placeholder={"1"}
              helperText={"In m/s"}
              defaultValue={system.directionMaxSpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.thrusters.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    directionMaxSpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing linear max speed",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="directionMaxSpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Linear Thrust"
              placeholder={"12500"}
              helperText="In Kilo-newtons. Affected by the mass of the ship the thrusters are attached to."
              defaultValue={system.directionThrust}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.thrusters.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    directionThrust: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing linear thrust",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="directionThrust"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Rotation Max Speed"
              placeholder={"5"}
              helperText={"In revolutions per minute"}
              defaultValue={system.rotationMaxSpeed}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.thrusters.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    rotationMaxSpeed: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing rotation max speed",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="rotationMaxSpeed"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-2 flex">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Rotation Thrust"
              placeholder={"12500"}
              helperText="In Kilo-newtons. Affected by the mass of the ship the thrusters are attached to."
              defaultValue={system.rotationThrust}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.thrusters.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    rotationThrust: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing rotation thrust",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="rotationThrust"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
