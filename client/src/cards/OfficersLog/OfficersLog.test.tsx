import * as React from "react";
import OfficersLog from ".";
import {render} from "client/test-utils";
import userEvent from "@testing-library/user-event";
import {act} from "react-dom/test-utils";

test("it should render without error", async () => {
  const {findByText, queryByText, findByRole, netSendSpy} = await render(
    <OfficersLog />,
    {
      netRequestData: {
        officersLog: [
          {
            message: "This is a test log entry",
            timestamp: 1639484836855,
          },
        ],
      },
    }
  );
  const logEl = await findByText("@560.60");
  expect(logEl).toBeInTheDocument();
  userEvent.click(logEl);
  expect(await findByText("This is a test log entry")).toBeInTheDocument();
  userEvent.click(await findByText("Clear"));
  expect(queryByText("This is a test log entry")).not.toBeInTheDocument();
  userEvent.click(await findByText("New Log Entry"));
  const entryText = "This is a new log entry.";
  userEvent.type(await findByRole("textbox"), entryText);
  await act(async () => {
    userEvent.click(await findByText("Save"));
  });
  expect(netSendSpy).toHaveBeenCalledTimes(1);
});
