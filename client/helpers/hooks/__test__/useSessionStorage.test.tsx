import userEvent from "@testing-library/user-event";
import React from "react";
import {render} from "test-utils";
import useSessionStorage from "../useSessionStorage";

const TestComp = ({storageKey = "test-session"}: any) => {
  const [state, setState] = useSessionStorage(storageKey, 0);
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
describe("useSessionStorage", () => {
  it("should listen for the events", async () => {
    const {findByTestId} = render(<TestComp />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    expect(element.innerHTML).toEqual("0");
    userEvent.click(element);
    expect(element.innerHTML).toEqual("1");
    userEvent.click(element);
    expect(element.innerHTML).toEqual("30");
    expect(window.sessionStorage.getItem("test-session")).toEqual("30");
  });
  it("should break in certain circumstances", async () => {
    window.sessionStorage.setItem("break-session", "{test:1}");
    const {findByTestId} = render(<TestComp storageKey="break-session" />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    expect(element.innerHTML).toEqual("{test:1}");
    userEvent.dblClick(element);
  });
});
