import {usePrompt} from "@thorium/ui/AlertDialog";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import {Outlet, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Fragment} from "react";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";
import Dropdown, {DropdownItem} from "@thorium/ui/Dropdown";
import {HiChevronDown} from "react-icons/hi";
import {Menu} from "@headlessui/react";
import {capitalCase} from "change-case";

export function ShipSystemsList() {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId?: string;
  };
  const navigate = useNavigate();
  const prompt = usePrompt();
  const data = useNetRequest("pluginShipSystems", {pluginId});
  const availableShipSystems = useNetRequest("availableShipSystems");
  const system = data.find(d => d.name === systemId);
  return (
    <div className="h-full">
      <Menubar backTo={`/config/${pluginId}/list`}></Menubar>
      <div className="p-8 h-[calc(100%-2rem)]">
        <h1 className="font-bold text-white text-3xl mb-4">
          Ship Systems Config
        </h1>
        <div className="flex gap-8 h-[calc(100%-3rem)]">
          <div className="flex flex-col w-80 h-full">
            <Dropdown
              triggerEl={
                <Menu.Button className="btn btn-success btn-sm w-full">
                  New Ship System <HiChevronDown />
                </Menu.Button>
              }
            >
              {availableShipSystems.map(system => (
                <DropdownItem
                  key={system.type}
                  onClick={async () => {
                    const name = await prompt({
                      header: "Enter system name",
                      defaultValue: capitalCase(system.type),
                    });
                    if (typeof name !== "string") return;
                    try {
                      const result = await netSend("pluginShipSystemCreate", {
                        name,
                        type: system.type,
                        pluginId,
                      });
                      navigate(`${result.shipSystemId}`);
                    } catch (err) {
                      if (err instanceof Error) {
                        toast({
                          title: "Error creating system",
                          body: err.message,
                          color: "error",
                        });
                        return;
                      }
                    }
                  }}
                >
                  {capitalCase(system.type)}
                </DropdownItem>
              ))}
            </Dropdown>

            <SearchableList
              items={data.map(d => ({
                id: d.name,
                name: d.name,
                description: d.description,
                category: capitalCase(d.type),
                tags: d.tags,
              }))}
              searchKeys={["name", "category", "tags"]}
              selectedItem={systemId || null}
              setSelectedItem={id => navigate(`${id}`)}
              renderItem={c => (
                <div className="flex justify-between items-center" key={c.id}>
                  <div>
                    {c.name}
                    <div>
                      <small>{c.category}</small>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
          <Fragment key={system?.name}>
            <Outlet />
          </Fragment>
        </div>
      </div>
    </div>
  );
}
