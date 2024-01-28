import {usePrompt} from "@thorium/ui/AlertDialog";
import {useParams, useNavigate, Outlet} from "react-router-dom";
import {useMenubar} from "@thorium/ui/Menubar";
import Button from "@thorium/ui/Button";
import {toast} from "@client/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import {Fragment, Suspense} from "react";
import {q} from "@client/context/AppContext";

export default function InventoryList() {
  const {pluginId, inventoryId} = useParams() as {
    pluginId: string;
    inventoryId?: string;
  };
  useMenubar({backTo: `/config/${pluginId}/list`});

  const navigate = useNavigate();
  const prompt = usePrompt();
  const [data] = q.plugin.inventory.all.useNetRequest({pluginId});
  const inventory = data.find(d => d.name === inventoryId);

  return (
    <div className="p-8 h-[calc(100%-2rem)]">
      <h1 className="font-bold text-white text-3xl mb-4">Inventory Config</h1>
      <div className="flex gap-8 h-[calc(100%-3rem)]">
        <div className="flex flex-col w-80 h-full">
          <Button
            className="btn-success btn-sm w-full"
            onClick={async () => {
              const name = await prompt({
                header: "Enter inventory item name",
              });
              if (typeof name !== "string") return;
              try {
                const result = await q.plugin.inventory.create.netSend({
                  name,
                  pluginId,
                });
                navigate(`${result.inventoryId}`);
              } catch (err) {
                if (err instanceof Error) {
                  toast({
                    title: "Error creating inventory item",
                    body: err.message,
                    color: "error",
                  });
                  return;
                }
              }
            }}
          >
            New Inventory Item
          </Button>

          <SearchableList
            items={data.map(d => ({
              id: d.name,
              name: d.name,
              description: d.description,
            }))}
            searchKeys={["name"]}
            selectedItem={inventoryId || null}
            setSelectedItem={({id}) => navigate(`${id}`)}
            renderItem={c => (
              <div className="flex justify-between items-center" key={c.id}>
                <div>{c.name}</div>
              </div>
            )}
          />
        </div>
        <Fragment key={inventory?.name}>
          <Outlet />
        </Fragment>
      </div>
    </div>
  );
}
