import {useNetSend} from "client/src/context/useNetSend";
import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useState} from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";

export function Basic() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId: string};
  const netSend = useNetSend();
  const data = useNetRequest("pluginShips", {pluginId});
  const ship = data.find(d => d.name === shipId);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  if (!ship) return <Navigate to={`/config/${pluginId}/ships`} />;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage="Class is required"
              label="Ship Class"
              placeholder="Galaxy"
              defaultValue={ship.name}
              onChange={() => setError(false)}
              onBlur={async (e: any) => {
                if (!e.target.value) return setError(true);
                const {shipId: newId} = await netSend("pluginShipSetName", {
                  pluginId,
                  shipId,
                  name: e.target.value,
                });
                navigate(`/config/${pluginId}/ships/${newId}`);
              }}
            />
          </div>
          <div className="pb-4">
            <label className="w-full">
              <Input
                labelHidden={false}
                label="Description"
                defaultValue={ship.description}
                onBlur={(e: any) =>
                  netSend("pluginShipSetDescription", {
                    pluginId,
                    shipId,
                    description: e.target.value,
                  })
                }
              />
            </label>
          </div>
          <div className="pb-4">
            <label className="w-full">
              <Input
                labelHidden={false}
                label="Category"
                type="textarea"
                defaultValue={ship.category}
                onBlur={(e: any) =>
                  netSend("pluginShipSetCategory", {
                    pluginId,
                    shipId,
                    category: e.target.value,
                  })
                }
              />
            </label>
          </div>
          <TagInput
            label="Tags"
            tags={ship.tags}
            onAdd={tag => {
              if (ship.tags.includes(tag)) return;
              netSend("pluginShipSetTags", {
                pluginId,
                shipId,
                tags: [...ship.tags, tag],
              });
            }}
            onRemove={tag => {
              if (!ship.tags.includes(tag)) return;
              netSend("pluginShipSetTags", {
                pluginId,
                shipId,
                tags: ship.tags.filter(t => t !== tag),
              });
            }}
          />
        </div>
      </div>
    </fieldset>
  );
}
