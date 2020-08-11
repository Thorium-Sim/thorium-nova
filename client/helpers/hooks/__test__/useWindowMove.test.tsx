import userEvent from "@testing-library/user-event";
import React from "react";
import {act} from "react-dom/test-utils";
import {fireEvent, render} from "test-utils";
import useWindowMove from "../useWindowMove";

type coords = {x: number; y: number};

const TestComp = ({handler}: any) => {
  const [position, measureRef, mouseDown] = useWindowMove(
    React.useState<coords | null>({x: 0, y: 0})
  );
  return (
    // @ts-ignore
    <div data-testid="test-comp" ref={measureRef} onMouseDown={mouseDown}>
      {JSON.stringify(position)}
    </div>
  );
};
describe("useWindowMove", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    // @ts-ignore
    window.requestAnimationFrame.mockRestore();
  });
  it("should listen for the events", async () => {
    const {findByTestId} = render(<TestComp />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    expect(element.innerHTML).toMatchInlineSnapshot(`"{\\"x\\":0,\\"y\\":0}"`);
    act(() => {
      fireEvent.mouseDown(element);
      fireEvent.mouseMove(window, {movementX: 5, movementY: 7});
      fireEvent.mouseUp(window);
    });
    expect(element.innerHTML).toMatchInlineSnapshot(
      `"{\\"x\\":null,\\"y\\":null}"`
    );
  });
});
