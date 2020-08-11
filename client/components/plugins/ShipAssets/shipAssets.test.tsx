import {TemplateShipAssetsDocument} from "../../../generated/graphql";
import React from "react";
import {render} from "test-utils";
import ShipAssets from ".";
import userEvent from "@testing-library/user-event";
describe("Ship Assets", () => {
  it("should render", async () => {
    const {findByText, findAllByText} = render(
      <ShipAssets onClose={() => {}} />,
      {
        mocks: [
          {
            request: {
              query: TemplateShipAssetsDocument,
              variables: {id: "2cajg1l9kkda54e0y"},
            },
            result: {
              data: {
                templateShip: {
                  id: "2cajg1l9kkda54e0y",
                  shipAssets: {},
                },
              },
            },
          },
        ],
      }
    );
    expect(await findByText("Ship Assets")).toBeInTheDocument();
    expect(await findByText("Logo")).toBeInTheDocument();
    expect(await findByText("Model")).toBeInTheDocument();
    expect(await findByText("Top View")).toBeInTheDocument();
    expect(await findByText("Side View")).toBeInTheDocument();
    expect((await findAllByText("Click or Drop files here")).length).toEqual(2);
  });
});
