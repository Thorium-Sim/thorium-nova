import {
  OutfitAbilitiesDocument,
  PluginOutfitDocument,
  PluginOutfitsDocument,
} from "../../../generated/graphql";
import React from "react";
import {Route, Routes} from "react-router";
import {render} from "test-utils";
import OutfitsConfig from ".";
import userEvent from "@testing-library/user-event";

describe("Outfit Config", () => {
  it("should properly render", async () => {
    const {findByText} = render(
      <Routes>
        <Route
          path="/edit/:pluginId/outfits/*"
          element={<OutfitsConfig />}
        ></Route>
      </Routes>,
      {
        initialRoutes: ["/edit/testPlugin/outfits/1/basic"],
        mocks: [
          {
            request: {
              query: PluginOutfitsDocument,
              variables: {pluginId: "testPlugin"},
            },
            result: {
              data: {
                pluginOutfits: [
                  {
                    id: "1",
                    identity: {
                      name: "Test Thrusters",
                    },
                    isOutfit: {
                      outfitType: "thrusters",
                    },
                  },
                ],
              },
            },
          },
          {
            request: {
              query: PluginOutfitDocument,
              variables: {pluginId: "testPlugin", outfitId: "1"},
            },
            result: {
              data: {
                pluginOutfit: {
                  id: "1",
                  identity: {
                    name: "Test Thrusters",
                    description: "",
                  },
                  isOutfit: {
                    outfitType: "thrusters",
                  },
                  tags: {
                    tags: [],
                  },
                  power: {
                    value: true,
                  },
                  damage: {
                    value: true,
                  },
                  efficiency: {
                    value: true,
                  },
                  heat: {
                    value: true,
                  },
                  trainingMode: {
                    value: true,
                  },
                },
              },
            },
          },
          {
            request: {
              query: OutfitAbilitiesDocument,
            },
            result: {
              data: {
                outfitAbilities: {
                  enumValues: [
                    {
                      name: "thrusters",
                    },
                  ],
                },
              },
            },
          },
        ],
      }
    );
    expect(await findByText("Outfits")).toBeInTheDocument();
    expect(await findByText("Test Thrusters")).toBeInTheDocument();
    userEvent.click(await findByText("Test Thrusters"));
    // expect(await findByText("Power")).toBeInTheDocument();
    // expect(await findByText("Damage")).toBeInTheDocument();
    // expect(await findByText("Heat")).toBeInTheDocument();
    // expect(await findByText("Efficiency")).toBeInTheDocument();
  });
});
