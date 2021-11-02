import {usePrompt} from "@thorium/ui/AlertDialog";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import Button from "@thorium/ui/Button";
import {useNetSend} from "client/src/context/useNetSend";
import {Outlet, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Fragment} from "react";

export function ShipList() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId?: string};
  const navigate = useNavigate();
  const prompt = usePrompt();
  const netSend = useNetSend();
  const data = useNetRequest("pluginShips", {pluginId});
  const ship = data.find(d => d.name === shipId);
  return (
    <div className="h-full">
      <Menubar backTo={`/config/${pluginId}/list`}></Menubar>
      <div className="p-8 h-[calc(100%-2rem)]">
        <h1 className="font-bold text-white text-3xl mb-4">Ships Config</h1>
        <div className="flex gap-8 h-[calc(100%-3rem)]">
          <div className="flex flex-col w-80 h-full">
            <Button
              className="w-full btn-sm btn-success"
              onClick={async () => {
                const name = await prompt({header: "Enter ship name"});
                if (typeof name !== "string" || name.trim().length === 0)
                  return;
                const {shipId} = await netSend("pluginShipCreate", {
                  name,
                  pluginId,
                });
                navigate(`${shipId}`);
              }}
            >
              New Ship
            </Button>

            <SearchableList
              items={data.map(d => ({
                id: d.name,
                name: d.name,
                description: d.description,
                category: d.category,
                tags: d.tags,
              }))}
              searchKeys={["name", "category", "tags"]}
              selectedItem={shipId || null}
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
          <Fragment key={ship?.name}>
            <Outlet />
          </Fragment>
        </div>
      </div>
    </div>
  );
}
