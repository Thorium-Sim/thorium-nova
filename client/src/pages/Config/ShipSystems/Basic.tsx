import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useState} from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";

export function Basic() {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const system = useNetRequest("pluginShipSystem", {pluginId, systemId});
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;
  return (
    <fieldset key={systemId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
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
                    name: e.target.value,
                  });
                  navigate(
                    `/config/${pluginId}/systems/${result.shipSystemId}`
                  );
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
          </div>
          <div className="pb-4">
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
                  description: e.target.value,
                })
              }
            />
          </div>
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
                tags: system.tags.filter(t => t !== tag),
              });
            }}
          />
        </div>
      </div>
    </fieldset>
  );
}
