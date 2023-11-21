import * as React from "react";
import {Suspense} from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import {MemoryRouter, useParams} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {InterstellarMap} from "@client/components/Starmap/InterstellarMap";
import SystemMarker from "@client/components/Starmap/SystemMarker";
import {q} from "@client/context/AppContext";
import {LiveQueryContext} from "@thorium/live-query/client/liveQueryContext";
import {MockNetRequestContext} from "@thorium/live-query/client/mockContext";
import {vi} from "vitest";

vi.mock("scheduler", () => require("scheduler/unstable_mock"));

//@ts-expect-error Mocking globals
globalThis.DOMRect = class {
  fromRect = vi.fn();
};
//@ts-expect-error Act environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function InterstellarMapWrapper() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const [stars] = q.plugin.starmap.all.useNetRequest({pluginId});
  return (
    <InterstellarMap>
      {stars.map(star => (
        <SystemMarker
          key={star.name}
          systemId={star.name}
          position={Object.values(star.position) as [number, number, number]}
          name={star.name}
          draggable
        />
      ))}
    </InterstellarMap>
  );
}
const client = new QueryClient();
describe("Starmap Plugin Editor", () => {
  it.skip("should render a single solar system properly", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LiveQueryContext.Provider value={{} as any}>
        <MemoryRouter>
          <Suspense fallback={null}>
            <MockNetRequestContext.Provider
              value={{
                plugin: {
                  starmap: {
                    all: [
                      {
                        name: "Test System",
                        position: {x: 10, y: 20, z: 30},
                        description: "This is a test",
                      },
                    ],
                  },
                },
              }}
            >
              <QueryClientProvider client={client}>
                <InterstellarMapWrapper />
              </QueryClientProvider>
            </MockNetRequestContext.Provider>
          </Suspense>
        </MemoryRouter>
      </LiveQueryContext.Provider>
    );

    // Stars, polar grid, the solar system, and the camera
    expect(renderer.scene.allChildren.length).toBe(4);
    expect(renderer.scene.findByType("Group").props.position).toEqual({
      x: 10,
      y: 20,
      z: 30,
    });
  });
  it.skip("should render multiple solar systems properly", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LiveQueryContext.Provider value={{} as any}>
        <MemoryRouter>
          <Suspense fallback={null}>
            <MockNetRequestContext.Provider
              value={{
                plugin: {
                  starmap: {
                    all: [
                      {
                        name: "Test System",
                        position: {x: 0, y: 0, z: 0},
                        description: "This is a test",
                      },
                      {
                        name: "Test System 2",
                        position: {x: 2, y: 0, z: 0},
                        description: "This is a test",
                      },
                      {
                        name: "Test System 3",
                        position: {x: 3, y: 0, z: 0},
                        description: "This is a test",
                      },
                    ],
                  },
                },
              }}
            >
              <QueryClientProvider client={client}>
                <InterstellarMapWrapper />
              </QueryClientProvider>
            </MockNetRequestContext.Provider>
          </Suspense>
        </MemoryRouter>
      </LiveQueryContext.Provider>
    );

    // Stars, polar grid, the solar system, and the camera
    expect(renderer.scene.allChildren.length).toBe(6);
  });
});
