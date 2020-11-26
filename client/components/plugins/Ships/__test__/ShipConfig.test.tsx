import {
  AllPluginOutfitsDocument,
  PluginShipBasicDocument,
  PluginShipCreateDocument,
  PluginShipOutfitsDocument,
  PluginShipsDocument,
  PluginShipSetCategoryDocument,
  PluginShipSetDescriptionDocument,
  PluginShipSetNameDocument,
  PluginShipSetTagsDocument,
} from "../../../../generated/graphql";
import React from "react";
import {Route, Routes} from "react-router";
import {render} from "test-utils";
import ShipsConfig from "../index";
import userEvent from "@testing-library/user-event";

const baseMocks = [
  {
    request: {
      query: PluginShipsDocument,
      variables: {pluginId: "testPlugin"},
    },
    result: {
      data: {
        pluginShips: [
          {
            id: "1",
            identity: {
              name: "Test Ship",
            },
          },
        ],
      },
    },
  },
  {
    request: {
      query: PluginShipsDocument,
      variables: {pluginId: "testPlugin"},
    },
    result: {
      data: {
        pluginShips: [
          {
            id: "1",
            identity: {
              name: "Test Ship",
            },
          },
          {
            id: "2",
            identity: {
              name: "Another Ship",
            },
          },
        ],
      },
    },
  },
  {
    request: {
      query: PluginShipBasicDocument,
      variables: {pluginId: "testPlugin", shipId: "2"},
    },
    result: {
      data: {
        pluginShip: {
          identity: {
            name: "Another Ship",
            description: "Description",
          },
          isShip: {
            category: "Cruiser",
            nameGeneratorPhrase: null,
          },
          tags: {
            tags: [],
          },
        },
      },
    },
  },
  {
    request: {
      query: PluginShipBasicDocument,
      variables: {pluginId: "testPlugin", shipId: "1"},
    },
    result: {
      data: {
        pluginShip: {
          identity: {
            name: "Test Ship",
            description: "Description",
          },
          isShip: {
            category: "Cruiser",
            nameGeneratorPhrase: null,
          },
          tags: {
            tags: ["Test Tag"],
          },
        },
      },
    },
  },
  {
    request: {
      query: PluginShipBasicDocument,
      variables: {pluginId: "testPlugin", shipId: "2"},
    },
    result: {
      data: {
        pluginShip: {
          identity: {
            name: "Another Ship",
            description: "Description",
          },
          isShip: {
            category: "Cruiser",
            nameGeneratorPhrase: null,
          },
          tags: {
            tags: [],
          },
        },
      },
    },
  },
  {
    request: {
      query: PluginShipBasicDocument,
      variables: {pluginId: "testPlugin", shipId: "1"},
    },
    result: {
      data: {
        pluginShip: {
          identity: {
            name: "Test Ship",
            description: "Description",
          },
          isShip: {
            category: "Cruiser",
            nameGeneratorPhrase: null,
          },
          tags: {
            tags: ["Test Tag"],
          },
        },
      },
    },
  },
];

describe("Ship Config", () => {
  it("should properly render", async () => {
    const {findByText, findByLabelText} = render(
      <Routes>
        <Route
          path="/edit/:pluginId/ships/:shipId/*"
          element={<ShipsConfig />}
        ></Route>
      </Routes>,
      {
        initialRoutes: ["/edit/testPlugin/ships/1/basic"],
        mocks: [
          ...baseMocks,
          {
            request: {
              query: PluginShipCreateDocument,
              variables: {pluginId: "testPlugin", name: "Another Ship"},
            },
            result: {
              data: {
                pluginShipCreate: {
                  id: "2",
                },
              },
            },
          },
        ],
      }
    );
    expect(await findByText("Ships")).toBeInTheDocument();
    expect(await findByText("Test Ship")).toBeInTheDocument();
    const newShipButton = await findByText("New Ship");
    expect(newShipButton).toBeInTheDocument();
    userEvent.click(newShipButton);
    userEvent.type(await findByLabelText("Response"), "Another Ship");
    userEvent.click(await findByText("OK"));
    const nameField = (await findByLabelText("Name")) as HTMLInputElement;
    expect(nameField).toBeInTheDocument();
    expect(nameField.value).toEqual("Another Ship");
  });
  it("should update basic properties render", async () => {
    const {findByText, findByLabelText, findByTestId} = render(
      <Routes>
        <Route
          path="/edit/:pluginId/ships/:shipId/*"
          element={<ShipsConfig />}
        ></Route>
      </Routes>,
      {
        initialRoutes: ["/edit/testPlugin/ships/1/basic"],
        mocks: [
          ...baseMocks,
          {
            request: {
              query: PluginShipSetNameDocument,
              variables: {
                pluginId: "testPlugin",
                shipId: "1",
                name: "New Ship Name",
              },
            },
            result: {
              data: {
                pluginShipSetName: {
                  id: "1",
                  identity: {
                    name: "New Ship Name",
                  },
                },
              },
            },
          },
          {
            request: {
              query: PluginShipSetDescriptionDocument,
              variables: {
                pluginId: "testPlugin",
                shipId: "1",
                description: "New Ship Description",
              },
            },
            result: {
              data: {
                pluginShipSetDescription: {
                  id: "1",
                  identity: {
                    description: "New Ship Description",
                  },
                },
              },
            },
          },
          {
            request: {
              query: PluginShipSetTagsDocument,
              variables: {
                pluginId: "testPlugin",
                shipId: "1",
                tags: ["Test Tag", "Tag 1"],
              },
            },
            result: {
              data: {
                pluginShipSetTags: {
                  id: "1",
                  tags: {
                    tags: ["Test Tag", "Tag 1"],
                  },
                },
              },
            },
          },
          {
            request: {
              query: PluginShipSetTagsDocument,
              variables: {pluginId: "testPlugin", shipId: "1", tags: []},
            },
            result: {
              data: {
                pluginShipSetTags: {
                  id: "1",
                  tags: {
                    tags: [],
                  },
                },
              },
            },
          },
          {
            request: {
              query: PluginShipSetCategoryDocument,
              variables: {
                pluginId: "testPlugin",
                shipId: "1",
                category: "Cruiser",
              },
            },
            result: {
              data: {
                pluginShipSetCategory: {
                  id: "1",
                },
              },
            },
          },
        ],
      }
    );
    const shipListItem = (await findByText("Test Ship")) as HTMLInputElement;
    userEvent.click(shipListItem);
    const nameField = (await findByLabelText("Name")) as HTMLInputElement;
    const descriptionField = (await findByLabelText(
      "Description"
    )) as HTMLInputElement;
    const tagsField = (await findByLabelText("Tags")) as HTMLInputElement;
    expect(nameField.value).toEqual("Test Ship");
    userEvent.clear(nameField);
    userEvent.type(nameField, "New Ship Name");
    userEvent.tab();
    userEvent.clear(descriptionField);
    userEvent.type(descriptionField, "New Ship Description");
    userEvent.tab();
    userEvent.type(tagsField, "Tag 1{enter}");
    userEvent.type(tagsField, "Test Tag{enter}");
    const tagRemove = await findByTestId("tag-remove");
    userEvent.click(tagRemove);

    // Having our mutations fire is enough of an expectation
  });
  it("should update outfits properties render", async () => {
    const {findByText, queryByText} = render(
      <Routes>
        <Route
          path="/edit/:pluginId/ships/:shipId/*"
          element={<ShipsConfig />}
        ></Route>
      </Routes>,
      {
        initialRoutes: ["/edit/testPlugin/ships/1/outfits"],
        mocks: [
          ...baseMocks,
          {
            request: {
              query: PluginShipOutfitsDocument,
              variables: {
                pluginId: "testPlugin",
                shipId: "1",
              },
            },
            result: {
              data: {
                pluginShip: {
                  id: "1",
                  shipOutfits: {
                    outfitIds: ["20"],
                    outfits: [
                      {
                        id: "20",
                        isOutfit: {
                          outfitType: "thrusters",
                        },
                        identity: {
                          name: "Thrusters",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            request: {
              query: AllPluginOutfitsDocument,
            },

            result: {
              data: {
                allPluginOutfits: [
                  {
                    id: "10",
                    pluginId: "testPlugin2",
                    pluginName: "Another Plugin",
                    identity: {
                      name: "Test Warp Engines",
                      description: "",
                    },
                    isOutfit: {
                      outfitType: "warpEngines",
                    },
                  },
                  {
                    id: "20",
                    pluginId: "testPlugin",
                    pluginName: "My Plugin",
                    identity: {
                      name: "Test Thrusters",
                      description: "",
                    },
                    isOutfit: {
                      outfitType: "thrusters",
                    },
                  },
                ],
              },
            },
          },
        ],
      }
    );
    const shipListItem = (await findByText("Test Ship")) as HTMLInputElement;
    userEvent.click(shipListItem);
    userEvent.click(await findByText("Outfits"));
    expect(await findByText("Available Systems")).toBeInTheDocument();
    expect(await findByText("Test Thrusters")).toBeInTheDocument();
    expect(queryByText("Test Warp Engines")).toBeFalsy();
    userEvent.click(await findByText("Include Other Plugins"));
    expect(queryByText("Test Warp Engines")).toBeTruthy();

    // Having our mutations fire is enough of an expectation
  });
});
