import {useConfirm} from "@thorium/ui/AlertDialog";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useParams, useNavigate, Navigate} from "react-router-dom";
import Button from "@thorium/ui/Button";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {useState} from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import Checkbox from "@thorium/ui/Checkbox";
import UploadWell from "@thorium/ui/UploadWell";
import {InventoryFlagValues} from "server/src/classes/Plugins/Inventory/InventoryFlags";
import {capitalCase} from "capital-case";
import InfoTip from "@thorium/ui/InfoTip";

export const InventoryLayout = () => {
  const {inventoryId, pluginId} = useParams() as {
    inventoryId: string;
    pluginId: string;
  };
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [volumeError, setVolumeError] = useState(false);
  const [durabilityError, setDurabilityError] = useState(false);
  const item = useNetRequest("pluginInventoryItem", {pluginId, inventoryId});
  const [error, setError] = useState(false);

  if (!inventoryId || !item)
    return <Navigate to={`/config/${pluginId}/inventory`} />;

  return (
    <fieldset
      key={inventoryId}
      className="flex-1 grid grid-cols-2 overflow-y-auto"
    >
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4 flex items-end">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage="Name is required"
              label="Name"
              placeholder="Ale Glass"
              defaultValue={item.name}
              onChange={() => setError(false)}
              onBlur={async (e: any) => {
                if (!e.target.value) return setError(true);
                try {
                  const result = await netSend("pluginInventoryUpdate", {
                    pluginId,
                    inventoryId,
                    name: e.target.value,
                  });
                  navigate(
                    `/config/${pluginId}/inventory/${result.inventoryId}`
                  );
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error renaming inventory item",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
          </div>
          <div className="pb-4 flex">
            <Input
              labelHidden={false}
              label="Plural"
              defaultValue={item.plural}
              onBlur={(e: any) =>
                netSend("pluginInventoryUpdate", {
                  pluginId,
                  inventoryId,
                  plural: e.target.value,
                })
              }
            />
          </div>
          <div className="pb-4 flex">
            <Input
              as="textarea"
              className="!h-32"
              labelHidden={false}
              label="Description"
              defaultValue={item.description}
              onBlur={(e: any) =>
                netSend("pluginInventoryUpdate", {
                  pluginId,
                  inventoryId,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="pb-4 flex items-end">
            <div className="flex-1">
              <TagInput
                label="Tags"
                tags={item.tags}
                onAdd={tag => {
                  if (item.tags.includes(tag)) return;
                  netSend("pluginInventoryUpdate", {
                    pluginId,
                    inventoryId,
                    tags: [...item.tags, tag],
                  });
                }}
                onRemove={tag => {
                  if (!item.tags.includes(tag)) return;
                  netSend("pluginInventoryUpdate", {
                    pluginId,
                    inventoryId,
                    tags: item.tags.filter(t => t !== tag),
                  });
                }}
              />
            </div>
          </div>
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={volumeError}
              invalidMessage="Volume must be a number greater than 0"
              label={
                <span>
                  Volume in m<sup>3</sup>
                </span>
              }
              defaultValue={item.volume}
              onFocus={() => setVolumeError(false)}
              onChange={() => setVolumeError(false)}
              onBlur={(e: any) => {
                if (
                  isNaN(parseFloat(e.target.value)) ||
                  parseFloat(e.target.value) <= 0
                )
                  return setVolumeError(true);
                netSend("pluginInventoryUpdate", {
                  pluginId,
                  inventoryId,
                  volume: Number(e.target.value),
                });
              }}
            />
            <small>
              The amount of space this item takes up in a cargo container or
              room.
            </small>
          </div>
          <div className="pb-4">
            <Checkbox
              label="Continuous"
              helperText="If unchecked, this is a discrete item, like a probe casing. When checked, this item can be continuously consumed, like fuel."
              onChange={e => {
                netSend("pluginInventoryUpdate", {
                  pluginId,
                  inventoryId,
                  continuous: e.target.checked,
                });
              }}
              defaultChecked={item.continuous}
            />
          </div>
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={durabilityError}
              invalidMessage="Durability must be between 0 and 1"
              label={<span>Durability</span>}
              defaultValue={item.durability}
              onFocus={() => setDurabilityError(false)}
              onChange={() => setDurabilityError(false)}
              onBlur={(e: any) => {
                if (
                  isNaN(parseFloat(e.target.value)) ||
                  parseFloat(e.target.value) < 0 ||
                  parseFloat(e.target.value) > 1
                )
                  return setDurabilityError(true);
                netSend("pluginInventoryUpdate", {
                  pluginId,
                  inventoryId,
                  durability: Number(e.target.value),
                });
              }}
            />
            <small>
              Probability the item will not be consumed when used. 1 means it
              lasts forever; 0 means it will always be consumed when used.
            </small>
          </div>
        </div>
      </div>
      <div className="max-w-sm">
        <div className="max-w-max">
          <label>Image</label>
          <UploadWell
            accept="image/*"
            onChange={async files => {
              await netSend("pluginInventoryUpdate", {
                pluginId,
                inventoryId,
                image: files[0],
              });
            }}
          >
            {item.assets.image && (
              <img
                src={`${item.assets.image}?${new Date().getTime()}`}
                alt="Inventory Item"
                className="w-10/12 h-10/12 object-cover"
              />
            )}
          </UploadWell>
          <p>
            <small>Image should be square and at least 512px wide.</small>
          </p>
        </div>
        <label>Inventory Type</label>
        {Object.entries(InventoryFlagValues).map(([key, value]) => {
          let defaultValue = key in item.flags;
          let keyVal = key as keyof typeof InventoryFlagValues;
          return (
            <>
              <Checkbox
                key={key}
                type="radio"
                name="flags"
                defaultChecked={defaultValue}
                onChange={e => {
                  netSend("pluginInventoryUpdate", {
                    pluginId,
                    inventoryId,
                    flags: {
                      ...{[key]: e.target.checked ? {} : undefined},
                    },
                  });
                }}
                label={
                  <span className="flex items-center cursor-pointer">
                    {capitalCase(key)}
                    <InfoTip>{value.info}</InfoTip>
                  </span>
                }
              />
              {/* TODO July 1 2022 - Figure out some way to configure the properties of inventory flags without it being totally nonsensical*/}
            </>
          );
        })}
      </div>
      <div>
        <Button
          className="w-full btn-outline btn-error btn-sm"
          disabled={!inventoryId}
          onClick={async () => {
            if (
              !inventoryId ||
              !(await confirm({
                header: "Are you sure you want to delete this inventory item?",
                body: "All content for this item, including images and other assets, will be gone forever.",
              }))
            )
              return;
            netSend("pluginInventoryDelete", {
              pluginId,
              inventoryId,
            });
            navigate(`/config/${pluginId}/inventory`);
          }}
        >
          Delete Inventory Item
        </Button>
        {/* <Button
                        className="w-full btn-outline btn-notice"
                        disabled={true}
                        onClick={async () => {
                          if (!pluginId) return;
                          const name = await prompt({
                            header: "What is the name of the duplicated plugin?",
                          });
                          if (!name || typeof name !== "string") return;
                          const result = await netSend("pluginShipDuplicate", {
                            pluginId: pluginId,
                            shipId
                            name,
                          });
                          if ("error" in result) {
                            toast({title:"Error duplicating plugin", body: result.error, color:"error"});
                            return;
                          }
                          navigate(`/config/${result.shipId}`);
                        }}
                      >
                        Duplicate Ship
                      </Button> */}
      </div>
    </fieldset>
  );
};