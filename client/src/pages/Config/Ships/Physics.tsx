import {Navigate, useParams} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useState} from "react";
import Input from "@thorium/ui/Input";
import {netSend} from "client/src/context/netSend";

export function Physics() {
  const [massError, setMassError] = useState(false);
  const [lengthError, setLengthError] = useState(false);

  const {pluginId, shipId} = useParams() as {
    pluginId: string;
    shipId: string;
  };
  const data = useNetRequest("pluginShips", {pluginId});
  const ship = data.find(d => d.name === shipId);
  if (!ship) return <Navigate to={`/config/${pluginId}/ships`} />;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={massError}
              invalidMessage="Mass must be a number greater than 0"
              label="Mass"
              placeholder="700000000"
              defaultValue={ship.mass}
              onChange={() => setMassError(false)}
              onBlur={async (e: any) => {
                if (
                  isNaN(parseFloat(e.target.value)) ||
                  parseFloat(e.target.value) <= 0
                )
                  return setMassError(true);
                await netSend("pluginShipSetMass", {
                  pluginId,
                  shipId,
                  mass: parseFloat(e.target.value),
                });
              }}
            />
            <small>
              Mass is measured in kilograms and is used to calculate
              acceleration, movement from impact, and gravitational forces.
            </small>
          </div>
          <div className="pb-4">
            <Input
              labelHidden={false}
              label="Size"
              isInvalid={lengthError}
              invalidMessage="Length must be a number greater than 0"
              placeholder="350"
              defaultValue={ship.length}
              onBlur={async (e: any) => {
                if (
                  isNaN(parseFloat(e.target.value)) ||
                  parseFloat(e.target.value) <= 0
                )
                  return setLengthError(true);
                await netSend("pluginShipSetLength", {
                  pluginId,
                  shipId,
                  length: e.target.value,
                });
              }}
            />
            <small>
              The length of the ship in meters. This is used to scale the 3D
              model which is used for determining the width and height of the
              ship. This determines the size on the viewscreen and the collision
              hitbox.
            </small>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
