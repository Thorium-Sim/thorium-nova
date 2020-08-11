import userEvent from "@testing-library/user-event";
import React from "react";
import {act} from "react-dom/test-utils";
import {render} from "test-utils";
import PropertyPalette from "../propertyPalette";

describe("useEventListener", () => {
  it("should listen for the events", async () => {
    const onClose = jest.fn();
    const {findByText, findByLabelText} = render(
      <PropertyPalette onClose={onClose}>
        <div>Test Text</div>
      </PropertyPalette>
    );

    const testText = await findByText("Test Text");
    expect(testText).toBeInTheDocument();
    const heading = await findByText("Property Palette");
    act(() => {
      userEvent.dblClick(heading);
    });
    expect(testText).not.toBeInTheDocument();
    const minimize = await findByLabelText("Minimize");
    act(() => {
      userEvent.click(minimize);
    });
    expect(await findByText("Test Text")).toBeInTheDocument();
  });
});
