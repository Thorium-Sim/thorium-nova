import * as React from "react";
import {Suspense} from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import {InterstellarMap} from ".";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {MockNetRequestContext} from "client/src/context/useNetRequest";
import {MemoryRouter} from "react-router-dom";
jest.mock("scheduler", () => require("scheduler/unstable_mock"));

describe("Starmap Plugin Editor", () => {
  it("should render a single solar system properly", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <ThoriumContext.Provider value={{} as any}>
        <MemoryRouter>
          <Suspense fallback={null}>
            <MockNetRequestContext.Provider
              value={{
                pluginSolarSystems: [
                  {
                    name: "Test System",
                    position: {x: 10, y: 20, z: 30},
                    description: "This is a test",
                  },
                ],
              }}
            >
              <InterstellarMap />
            </MockNetRequestContext.Provider>
          </Suspense>
        </MemoryRouter>
      </ThoriumContext.Provider>
    );

    // Stars, polar grid, the solar system, and the camera
    expect(renderer.scene.allChildren.length).toBe(4);
    expect(renderer.scene.findByType("Group").props.position).toEqual({
      x: 10,
      y: 20,
      z: 30,
    });
  });
  it("should render multiple solar systems properly", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <ThoriumContext.Provider value={{} as any}>
        <MemoryRouter>
          <Suspense fallback={null}>
            <MockNetRequestContext.Provider
              value={{
                pluginSolarSystems: [
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
              }}
            >
              <InterstellarMap />
            </MockNetRequestContext.Provider>
          </Suspense>
        </MemoryRouter>
      </ThoriumContext.Provider>
    );

    // Stars, polar grid, the solar system, and the camera
    expect(renderer.scene.allChildren.length).toBe(6);
  });
});
