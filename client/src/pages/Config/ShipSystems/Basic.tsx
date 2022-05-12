import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useContext, useReducer, useState} from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {ShipPluginIdContext} from "../Ships/ShipSystemOverrideContext";
import {OverrideResetButton} from "./OverrideResetButton";

export function Basic() {
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const system = useNetRequest("pluginShipSystem", {
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const key = `${systemId}${rekey}`;
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;
  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4 flex items-end">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage="Name is required"
              label="Name"
              placeholder="Duotronic Interface"
              defaultValue={system.name}
              onChange={() => setError(false)}
              onBlur={async (e: any) => {
                if (!e.target.value) return setError(true);
                try {
                  const result = await netSend("pluginShipSystemUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    shipId,
                    shipPluginId,
                    name: e.target.value,
                  });
                  if (!shipId) {
                    navigate(
                      `/config/${pluginId}/systems/${result.shipSystemId}`
                    );
                  }
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error renaming system",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton property="name" setRekey={setRekey} />
          </div>
          <div className="pb-4 flex">
            <Input
              as="textarea"
              className="!h-32"
              labelHidden={false}
              label="Description"
              defaultValue={system.description}
              onBlur={(e: any) =>
                netSend("pluginShipSystemUpdate", {
                  pluginId,
                  shipSystemId: systemId,
                  shipId,
                  shipPluginId,
                  description: e.target.value,
                })
              }
            />
            <OverrideResetButton
              property="description"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
          <div className="pb-4 flex items-end">
            <div className="flex-1">
              <TagInput
                label="Tags"
                tags={system.tags}
                onAdd={tag => {
                  if (system.tags.includes(tag)) return;
                  netSend("pluginShipSystemUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    tags: [...system.tags, tag],
                  });
                }}
                onRemove={tag => {
                  if (!system.tags.includes(tag)) return;
                  netSend("pluginShipSystemUpdate", {
                    pluginId,
                    shipSystemId: systemId,
                    shipId,
                    shipPluginId,
                    tags: system.tags.filter(t => t !== tag),
                  });
                }}
              />
            </div>
            <OverrideResetButton property="tags" setRekey={setRekey} />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
