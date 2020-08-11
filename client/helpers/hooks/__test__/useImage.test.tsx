import React, {Suspense} from "react";
import {render} from "test-utils";
import useImage from "../useImage";

const TestComp = () => {
  const image = useImage("https://unsplash.it/128");
  return (
    <div data-testid="test-comp">
      <img src={image} />
    </div>
  );
};
describe("useImage", () => {
  it("should listen for the events", async () => {
    const {getByText, findByTestId} = render(
      <Suspense fallback="Loading">
        <TestComp />
      </Suspense>
    );
    expect(getByText("Loading")).toBeInTheDocument();
    // TODO: Add tests for when the suspense resolves
  });
});
