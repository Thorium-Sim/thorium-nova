import userEvent from "@testing-library/user-event";
import { render } from "@thorium/utils/react-test-utils";
import { expect, test } from "vitest";

import OfficersLog from ".";

test("it should render without error", async () => {
	const { findByText, queryByText, findByRole, netSendSpy } = await render(<OfficersLog />, {
		netRequestData: {
			officersLog: {
				get: [
					{
						message: "This is a test log entry",
						timestamp: 1639484836855,
					},
				],
			},
		},
	});
	const logEl = await findByText("@560.60", {}, { timeout: 5000 });
	expect(logEl).toBeDefined();
	await userEvent.click(logEl);
	expect(await findByText("This is a test log entry")).toBeDefined();
	await userEvent.click(await findByText("Clear"));
	expect(queryByText("This is a test log entry")).toBeNull();
	await userEvent.click(await findByText("New Log Entry"));
	const entryText = "This is a new log entry.";
	await userEvent.type(await findByRole("textbox"), entryText);
	await userEvent.click(await findByText("Save"));
	expect(netSendSpy).toHaveBeenCalledTimes(1);
});
