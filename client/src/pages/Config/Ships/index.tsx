import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import Button from "@thorium/ui/Button";
import {useNetSend} from "client/src/context/useNetSend";
import {
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {Suspense} from "react";

const ShipLayout = () => {
  const {pathname} = useLocation();
  const {shipId, pluginId} = useParams() as {shipId: string; pluginId: string};
  const navigate = useNavigate();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const netSend = useNetSend();
  const data = useNetRequest("pluginShip", {pluginId, shipId});
  if (!shipId || !data) return <Navigate to={`/config/${pluginId}/ships`} />;
  if (
    pathname.endsWith("/basic") ||
    pathname.endsWith("/assets") ||
    pathname.endsWith("/physics") ||
    pathname.endsWith("/systems")
  ) {
    return (
      <>
        <div>
          <Button
            className="w-full btn-outline btn-error"
            disabled={!shipId}
            onClick={async () => {
              if (
                !shipId ||
                !(await confirm({
                  header: "Are you sure you want to delete this ship?",
                  body: "All content for this ship, including images and other assets, will be gone forever.",
                }))
              )
                return;
              netSend("pluginShipDelete", {pluginId, shipId});
              navigate(`/config/${pluginId}/ships`);
            }}
          >
            Delete Ship
          </Button>
          {/* <Button
              className="w-full btn-outline btn-alert"
              disabled={!pluginId}
              onClick={async () => {
                if (!pluginId) return;
                const name = await prompt({
                  header: "What is the name of the duplicated plugin?",
                });
                if (!name || typeof name !== "string") return;
                const {pluginId: duplicateId} = await netSend(
                  "pluginDuplicate",
                  {
                    pluginId: pluginId,
                    name,
                  }
                );
                navigate(`/config/${duplicateId}`);
              }}
            >
              Duplicate Plugin
            </Button> */}
        </div>
        <Outlet />
      </>
    );
  }
  return <Navigate to={`basic`} />;
};

function ShipList() {
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
          <div className="w-96 space-y-4" key={ship?.name}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function Basic() {
  return null;
}
function Assets() {
  return null;
}
function Physics() {
  return null;
}
function Systems() {
  return null;
}
export default function ShipsRoute() {
  return (
    <Routes>
      <Route path="/" element={<ShipList />}>
        <Route
          path=":shipId"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ShipLayout />
            </Suspense>
          }
        >
          <Route path="basic" element={<Basic />} />
          <Route path="assets" element={<Assets />} />
          <Route path="physics" element={<Physics />} />
          <Route path="systems" element={<Systems />} />
        </Route>
      </Route>
    </Routes>
  );
}
