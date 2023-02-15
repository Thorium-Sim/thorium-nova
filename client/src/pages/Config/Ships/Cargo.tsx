import {Navigate, useParams} from "react-router-dom";
import {useState} from "react";
import Input from "@thorium/ui/Input";
import {toast} from "client/src/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import {q} from "@client/context/AppContext";

export function Cargo() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId: string};
  const [data] = q.plugin.ship.all.useNetRequest({pluginId});
  const ship = data.find(d => d.name === shipId);
  const [error, setError] = useState(false);
  if (!ship) return <Navigate to={`/config/${pluginId}/ships`} />;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto max-w-3xl">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage="Cargo containers must be an integer greater than 1"
              label={
                <>
                  Cargo Container Count{" "}
                  <InfoTip>
                    Cargo is moved through the ship inside cargo containers.
                    Choose a number of cargo containers that make the
                    quartermaster carefully plan the cargo transfers.
                  </InfoTip>
                </>
              }
              placeholder="4"
              defaultValue={ship.cargoContainers}
              onChange={() => setError(false)}
              onBlur={async (e: any) => {
                if (!e.target.value) return setError(true);
                try {
                  const result = await q.plugin.ship.update.netSend({
                    pluginId,
                    shipId,
                    cargoContainers: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error updating cargo containers",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage="Cargo container volume must be greater than 1"
              label="Cargo Container Volume in Cubic Meters"
              placeholder="4"
              defaultValue={ship.cargoContainerVolume}
              onChange={() => setError(false)}
              onBlur={async (e: any) => {
                if (!e.target.value) return setError(true);
                try {
                  const result = await q.plugin.ship.update.netSend({
                    pluginId,
                    shipId,
                    cargoContainerVolume: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error updating cargo container volume",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
          <div className="pb-4">
            <p>
              Total cargo movement capacity:{" "}
              <strong>
                {ship.cargoContainers * ship.cargoContainerVolume} L
              </strong>
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
