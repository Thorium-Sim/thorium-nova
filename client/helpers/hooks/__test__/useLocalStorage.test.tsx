import userEvent from "@testing-library/user-event";
import React from "react";
import {render} from "test-utils";
import useLocalStorage from "../useLocalStorage";

const TestComp = ({storageKey = "test-local"}: any) => {
  const [state, setState] = useLocalStorage(storageKey, 0);
  return (
    <div
      data-testid="test-comp"
      onClick={() => {
        state === 0 ? setState(s => s + 1) : setState(30);
      }}
      onDoubleClick={() => {
        setState(() => {
          throw new Error();
        });
      }}
    >
      {state}
    </div>
  );
};
describe("useLocalStorage", () => {
  it("should listen for the events", async () => {
    const {findByTestId, debug} = render(<TestComp />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    expect(element.innerHTML).toEqual("0");
    userEvent.click(element);
    expect(element.innerHTML).toEqual("1");
    userEvent.click(element);
    expect(element.innerHTML).toEqual("30");
    expect(window.localStorage.getItem("test-local")).toEqual("30");
  });
  it("should break in certain circumstances", async () => {
    window.localStorage.setItem("break-local", "{test:1}");
    const {findByTestId, debug} = render(<TestComp storageKey="break-local" />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    expect(element.innerHTML).toEqual("{test:1}");
    userEvent.dblClick(element);
  });
});
