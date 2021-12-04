import {usePrompt} from "@thorium/ui/AlertDialog";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import Button from "@thorium/ui/Button";
import {Outlet, useParams, useNavigate} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Fragment} from "react";
import {netSend} from "client/src/context/netSend";
import {toast} from "client/src/context/ToastContext";

export function ThemeList() {
  const {pluginId, themeId} = useParams() as {
    pluginId: string;
    themeId?: string;
  };
  const navigate = useNavigate();
  const prompt = usePrompt();
  const data = useNetRequest("pluginThemes", {pluginId});
  const theme = data.find(d => d.name === themeId);
  return (
    <div className="h-full">
      <Menubar backTo={`/config/${pluginId}/list`}></Menubar>
      <div className="p-8 h-[calc(100%-2rem)]">
        <h1 className="font-bold text-white text-3xl mb-4">Themes Config</h1>
        <div className="flex gap-8 h-[calc(100%-3rem)]">
          <div className="flex flex-col w-80 h-full">
            <Button
              className="w-full btn-sm btn-success"
              onClick={async () => {
                const name = await prompt({header: "Enter theme name"});
                if (typeof name !== "string" || name.trim().length === 0)
                  return;
                const result = await netSend("pluginThemeCreate", {
                  name,
                  pluginId,
                });
                if ("error" in result) {
                  toast({
                    title: "Error creating theme",
                    body: result.error,
                    color: "error",
                  });
                  return;
                }
                navigate(`${result.themeId}`);
              }}
            >
              New theme
            </Button>

            <SearchableList
              items={data.map(d => ({
                id: d.name,
                name: d.name,
              }))}
              searchKeys={["name"]}
              selectedItem={themeId || null}
              setSelectedItem={id => navigate(`${id}`)}
              renderItem={c => (
                <div className="flex justify-between items-center" key={c.id}>
                  <div>{c.name}</div>
                </div>
              )}
            />
          </div>
          <Fragment key={theme?.name}>
            <Outlet />
          </Fragment>
        </div>
      </div>
    </div>
  );
}