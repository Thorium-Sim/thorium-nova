import userEvent from "@testing-library/user-event";
import React from "react";
import {render, findByTitle, waitForElementToBeRemoved} from "test-utils";
import Theme from "../theme";

describe("Theme page", () => {
  it("should render", async () => {
    const {findByText, findAllByText, findByTestId} = render(<Theme></Theme>);
    expect(await findByText("Theme Builder")).toBeInTheDocument();
    const primaryRow = await findByTestId("theme-primary");
    expect(primaryRow).toBeInTheDocument();
    const colorPicker = await findByTitle(primaryRow, "Color Picker");
    expect(colorPicker).toBeInTheDocument();
    userEvent.click(colorPicker);
    const hex = await findByText("hex");
    expect(hex).toBeInTheDocument();
    const inputElement = hex.parentElement?.querySelector("input");
    if (inputElement) {
      userEvent.type(inputElement, "336699");
    }
    userEvent.click(primaryRow);
  });
});
