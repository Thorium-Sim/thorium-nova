import {Outlet, useNavigate, useParams} from "@remix-run/react";
import {DeckNodeContextProvider} from "./$shipId+/shipMap.$deckName/DeckNodeContext";
import {usePrompt} from "@thorium/ui/AlertDialog";
import {q} from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import {toast} from "@client/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import {Fragment} from "react";

export default function ShipConfigLayout() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId?: string};
  const navigate = useNavigate();
  const prompt = usePrompt();
  const [ships] = q.plugin.ship.all.useNetRequest({pluginId});
  const ship = ships.find(d => d.name === shipId);

  return (
    <DeckNodeContextProvider>
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
                try {
                  const result = await q.plugin.ship.create.netSend({
                    name,
                    pluginId,
                  });
                  navigate(`${result.shipId}`);
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error creating ship",
                      body: err.message,
                      color: "error",
                    });
                    return;
                  }
                }
              }}
            >
              New Ship
            </Button>

            <SearchableList
              items={ships.map(d => ({
                id: d.name,
                name: d.name,
                description: d.description,
                category: d.category,
                tags: d.tags,
              }))}
              searchKeys={["name", "category", "tags"]}
              selectedItem={shipId || null}
              setSelectedItem={({id}) => navigate(`${id}`)}
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
    </DeckNodeContextProvider>
  );
}
