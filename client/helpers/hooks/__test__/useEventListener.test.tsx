import userEvent from "@testing-library/user-event";
import React from "react";
import {render} from "test-utils";
import useEventListener from "../useEventListener";

const TestComp = ({handler}: any) => {
  const ref = React.useRef<HTMLDivElement>(null);
  useEventListener("click", handler);
  return <div ref={ref} data-testid="test-comp"></div>;
};
describe("useEventListener", () => {
  it("should listen for the events", async () => {
    const handler = jest.fn();
    const {findByTestId} = render(<TestComp handler={handler} />);
    const element = await findByTestId("test-comp");
    expect(element).toBeInTheDocument();
    userEvent.click(element);
    expect(handler).toHaveBeenCalled();
  });
});
