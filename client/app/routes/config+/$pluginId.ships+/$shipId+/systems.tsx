import SearchableList from "@thorium/ui/SearchableList";
import {Outlet, useNavigate, useParams} from "@remix-run/react";
import Button from "@thorium/ui/Button";
import {useState} from "react";
import {capitalCase} from "change-case";
import {Suspense} from "react";
import {ShipPluginIdContext} from "@client/context/ShipSystemOverrideContext";
import {q} from "@client/context/AppContext";
import {Icon} from "@thorium/ui/Icon";

export default function Systems() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId: string};
  const [allSystems] = q.plugin.systems.all.useNetRequest({pluginId});
  const [ship] = q.plugin.ship.get.useNetRequest({pluginId, shipId});

  const [allPlugins, setAllPlugins] = useState(false);

  const systems = allSystems.filter(
    sys =>
      (sys.allowMultiple
        ? true
        : !ship.shipSystems.some(
            ss => ss.systemId === sys.name && ss.pluginId === sys.pluginName
          )) && (allPlugins ? true : sys.pluginName === pluginId)
  );

  const navigate = useNavigate();
  return (
    <>
      <div className="w-72 flex flex-col">
        {/* TODO April 27 2022 - Figure out some way to define and determine the maximum number of
        one type of system that can be assigned to a ship. Ex. only one impulse engine should be assignable. */}
        <h3 className="text-2xl font-bold">Available Systems</h3>
        <SearchableList
          showSearchLabel={false}
          selectedItem={null}
          setSelectedItem={item => {
            if (item.allowMultiple) return null;
            q.plugin.ship.toggleSystem.netSend({
              shipId,
              pluginId,
              systemId: item.id.systemId,
              systemPlugin: item.id.pluginId,
            });
          }}
          items={systems.map(c => ({
            id: {systemId: c.name, pluginId: c.pluginName},
            category: capitalCase(c.type),
            allowMultiple: c.allowMultiple,
            label: c.name,
            pluginName: c.pluginName,
          }))}
          renderItem={item => (
            <div className="flex">
              {item.label}
              <div className="flex-1"></div>
              {item.allowMultiple ? (
                <Button
                  className="btn-xs"
                  onClick={() => {
                    q.plugin.ship.addSystem.netSend({
                      shipId,
                      pluginId,
                      systemId: item.id.systemId,
                      systemPlugin: item.id.pluginId,
                    });
                  }}
                >
                  <Icon name="plus" />
                </Button>
              ) : null}
            </div>
          )}
        />
        {!allPlugins && (
          <Button
            className="mt-4 btn-info btn-sm w-full"
            onClick={() => setAllPlugins(true)}
          >
            Include Other Plugins
          </Button>
        )}
        {allPlugins && (
          <Button
            className="btn-warning mt-4 btn-sm w-full"
            onClick={() => setAllPlugins(false)}
          >
            Exclude Other Plugins
          </Button>
        )}
      </div>
      <div className="w-72 flex flex-col">
        <h3 className="text-2xl font-bold">Assigned Systems</h3>
        <SearchableList
          showSearchLabel={false}
          selectedItem={null}
          setSelectedItem={item => {}}
          items={ship.shipSystems
            .map(c => {
              const system = allSystems.find(
                s => s.name === c.systemId && s.pluginName === c.pluginId
              );
              if (!system) return null;
              return {
                id: c.id,
                category: capitalCase(system.type),
                label: c.overrides?.name || system.name,
                pluginName: system.pluginName,
              };
            })
            .filter(notNull)}
          renderItem={item => (
            <span className="flex items-center justify-between gap-2">
              <span>{item.label}</span>
              <span className="flex-1"></span>
              <Button
                className="btn-outline btn-xs btn-primary"
                aria-label="Edit"
                onClick={() => navigate(`edit/${item.pluginName}/${item.id}`)}
              >
                <Icon name="pencil" />
              </Button>
              <Button
                className="btn-outline btn-xs btn-error"
                aria-label="Remove"
                onClick={() =>
                  q.plugin.ship.toggleSystem.netSend({
                    shipId,
                    pluginId,
                    systemId: item.id,
                    systemPlugin: item.pluginName,
                  })
                }
              >
                <Icon name="ban" />
              </Button>
            </span>
          )}
        />
        <Suspense fallback={null}>
          <ShipPluginIdContext.Provider value={pluginId}>
            <Outlet />
          </ShipPluginIdContext.Provider>
        </Suspense>
      </div>
    </>
  );
}

function notNull<T>(x: T): x is NonNullable<T> {
  return x !== null;
}
