import {Routes, Route} from "react-router";
import {SystemLayout} from "./SystemLayout";
import {ShipSystemsList} from "./ShipSystemsList";
import {Basic} from "./Basic";
import {Power} from "./Power";
import {Heat} from "./Heat";
import {useParams} from "react-router-dom";
import {lazy, Suspense} from "react";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {q} from "@client/context/AppContext";
import NoMatch from "@client/pages/NotFound";

export const systemConfigs = Object.fromEntries(
  Object.entries(import.meta.glob("./SystemConfigs/*.tsx")).map(
    ([path, mod]) => {
      const pathRegx = /\.\/SystemConfigs\/(.*)\.tsx/g;
      const [, name] = pathRegx.exec(path)!;

      return [name, lazy(mod as any)];
    }
  )
);

const SystemConfig = () => {
  const {pluginId, systemId} = useParams() as {
    pluginId: string;
    systemId: string;
  };
  const [system] = q.plugin.systems.get.useNetRequest({pluginId, systemId});
  const Comp = systemConfigs[system.type];
  if (!Comp)
    return (
      <h3 className="text-center text-xl">
        No configuration for this system type.
      </h3>
    );
  return <Comp />;
};

export default function ShipSystemsConfig() {
  return (
    <Routes>
      <Route path="/" element={<ShipSystemsList />}>
        <Route path=":systemId" element={<SystemLayout />}>
          <Route path="basic" element={<Basic />} />
          <Route
            path="system"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <SystemConfig />
              </Suspense>
            }
          />

          <Route path="power" element={<Power />} />
          <Route path="heat" element={<Heat />} />
        </Route>
      </Route>
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}
