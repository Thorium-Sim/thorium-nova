import Menubar from "@thorium/ui/Menubar";
import {
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

const ShipLayout = () => {
  const {pathname} = useLocation();
  if (
    pathname.endsWith("/basic") ||
    pathname.endsWith("/assets") ||
    pathname.endsWith("/physics") ||
    pathname.endsWith("/systems")
  ) {
    return <Outlet />;
  }
  return <Navigate to={`basic`} />;
};

function ShipList() {
  const {pluginId} = useParams();
  return (
    <div className="h-full">
      <Menubar backTo={`/config/${pluginId}/list`}></Menubar>
      <div className="p-8 h-[calc(100%-2rem)]">
        <h1 className="font-bold text-white text-3xl mb-4">Ships Config</h1>
        <div className="flex flex-col h-[calc(100%-4rem)]"></div>
        <Outlet />
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
        <Route path=":shipId" element={<ShipLayout />}>
          <Route path="basic" element={<Basic />} />
          <Route path="assets" element={<Assets />} />
          <Route path="physics" element={<Physics />} />
          <Route path="systems" element={<Systems />} />
        </Route>
      </Route>
    </Routes>
  );
}
