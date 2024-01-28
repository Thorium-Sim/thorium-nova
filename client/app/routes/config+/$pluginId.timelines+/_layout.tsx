import {useMenubar} from "@thorium/ui/Menubar";
import {useParams, Outlet, useNavigate} from "@remix-run/react";
import {usePrompt} from "@thorium/ui/AlertDialog";
import {q} from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import {toast} from "@client/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import {Fragment} from "react";

export default function TimelinesConfig() {
  const {pluginId, timelineId} = useParams() as {
    pluginId: string;
    timelineId?: string;
  };
  useMenubar({
    backTo: `/config/${pluginId}/list`,
  });
  const prompt = usePrompt();
  const navigate = useNavigate();
  const [data] = q.plugin.timeline.all.useNetRequest({pluginId});

  const timeline = data.find(d => d.name === timelineId);

  return (
    <div className="p-8 h-[calc(100%-2rem)]">
      <h1 className="font-bold text-white text-3xl mb-4">Timelines Config</h1>
      <div className="flex gap-8 h-[calc(100%-3rem)]">
        <div className="flex flex-col w-80 h-full">
          <Button
            className="btn-success btn-sm w-full"
            onClick={async () => {
              const name = await prompt({
                header: "Enter timeline name",
              });
              if (typeof name !== "string") return;
              try {
                const result = await q.plugin.timeline.create.netSend({
                  name,
                  pluginId,
                });
                navigate(`${result.timelineId}`);
              } catch (err) {
                if (err instanceof Error) {
                  toast({
                    title: "Error creating timeline",
                    body: err.message,
                    color: "error",
                  });
                  return;
                }
              }
            }}
          >
            New Timeline
          </Button>

          <SearchableList
            items={data.map(d => ({
              id: d.name,
              name: d.name,
              description: d.description,
            }))}
            searchKeys={["name"]}
            selectedItem={timelineId || null}
            setSelectedItem={({id}) => navigate(`${id}`)}
            renderItem={c => (
              <div className="flex justify-between items-center" key={c.id}>
                <div>{c.name}</div>
              </div>
            )}
          />
        </div>
        <Fragment key={timeline?.name}>
          <Outlet />
        </Fragment>
      </div>
    </div>
  );
}
