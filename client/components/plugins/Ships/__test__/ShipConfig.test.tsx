import {
  PluginShipBasicDocument,
  PluginShipCreateDocument,
  PluginShipsDocument,
} from "../../../../generated/graphql";
import React from "react";
import {Route, Routes} from "react-router";
import {render} from "test-utils";
import ShipsConfig from "../index";
import userEvent from "@testing-library/user-event";

let time = Date.now();
describe("Ship Config", () => {
  it("should properly render", async () => {
    console.log(Date.now() - time);
    const {findByText, findByDisplayValue, findByLabelText} = render(
      <Routes>
        <Route
          path="/edit/:pluginId/ships/:shipId/*"
          element={<ShipsConfig />}
        ></Route>
      </Routes>,
      {
        initialRoutes: ["/edit/testPlugin/ships/testId/basic"],
        mocks: [
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
                  tags: {
                    tags: [],
                  },
                },
              },
            },
          },
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
    console.log("Setup Done", Date.now() - time);
    expect(await findByText("Ships")).toBeInTheDocument();
    expect(await findByText("Test Ship")).toBeInTheDocument();
    const newShipButton = await findByText("New Ship");
    console.log("Initial Assertions", Date.now() - time);
    expect(newShipButton).toBeInTheDocument();
    userEvent.click(newShipButton);
    userEvent.type(await findByLabelText("Response"), "Another Ship");
    console.log("MOdal open", Date.now() - time);
    userEvent.click(await findByText("OK"));
    console.log("MOdal Done", Date.now() - time);
    const nameField = (await findByLabelText("Name")) as HTMLInputElement;
    expect(nameField).toBeInTheDocument();
    expect(nameField.value).toEqual("Another Ship");
    console.log("Complete", Date.now() - time);
  });
});
