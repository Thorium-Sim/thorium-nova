import {Navigate, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Fragment, useState} from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import {Popover, Transition} from "@headlessui/react";
import {FaChevronDown} from "react-icons/fa";
import SearchableList from "@thorium/ui/SearchableList";

export function Basic() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId: string};
  const data = useNetRequest("pluginShips", {pluginId});
  const allThemes = useNetRequest("pluginAllThemes");
  const ship = data.find(d => d.name === shipId);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  if (!ship) return <Navigate to={`/config/${pluginId}/ships`} />;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto max-w-3xl">
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
                try {
                  const result = await netSend("pluginShipUpdate", {
                    pluginId,
                    shipId,
                    name: e.target.value,
                  });
                  navigate(`/config/${pluginId}/ships/${result.shipId}`);
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error renaming ship",
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
              defaultValue={ship.description}
              onBlur={(e: any) =>
                netSend("pluginShipUpdate", {
                  pluginId,
                  shipId,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="pb-4">
            <Input
              labelHidden={false}
              label="Category"
              type="textarea"
              defaultValue={ship.category}
              onBlur={(e: any) =>
                netSend("pluginShipUpdate", {
                  pluginId,
                  shipId,
                  category: e.target.value,
                })
              }
            />
          </div>
          <TagInput
            label="Tags"
            tags={ship.tags}
            onAdd={tag => {
              if (ship.tags.includes(tag)) return;
              netSend("pluginShipUpdate", {
                pluginId,
                shipId,
                tags: [...ship.tags, tag],
              });
            }}
            onRemove={tag => {
              if (!ship.tags.includes(tag)) return;
              netSend("pluginShipUpdate", {
                pluginId,
                shipId,
                tags: ship.tags.filter(t => t !== tag),
              });
            }}
          />
          <label>Theme</label>
          <div className="flex flex-wrap items-center">
            <p>
              {ship.theme?.themeId ? (
                <>
                  {ship.theme.themeId} ({ship.theme.pluginId})
                </>
              ) : (
                "Default Theme"
              )}
            </p>
            <Popover className="relative">
              {({open, close}) => (
                <>
                  <Popover.Button
                    className={`btn btn-primary ml-4
             ${open ? "" : "text-opacity-90"}
             group`}
                  >
                    <span>Change Theme</span>
                    <FaChevronDown
                      className={`${open ? "" : "text-opacity-70"}
               ml-2 h-5 w-5 group-hover:text-opacity-80 transition ease-in-out duration-150`}
                      aria-hidden="true"
                    />
                  </Popover.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute z-10 w-screen max-w-sm mt-3 sm:px-0">
                      <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5  backdrop-filter backdrop-blur bg-black/70 p-4">
                        <SearchableList
                          items={
                            allThemes.map(t => ({
                              id: t,
                              label: t.themeId,
                              category: t.pluginId,
                            })) || []
                          }
                          selectedItem={ship.theme}
                          setSelectedItem={item => {
                            netSend("pluginShipUpdate", {
                              pluginId,
                              shipId,
                              theme: item,
                            });
                            close();
                          }}
                        ></SearchableList>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
