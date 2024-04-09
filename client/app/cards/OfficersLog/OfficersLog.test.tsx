import * as React from "react";
import OfficersLog from ".";
import { render } from "@client/react-test-utils";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

test("it should render without error", async () => {
	const queryClient = new QueryClient();

	const { findByText, queryByText, findByRole, netSendSpy } = await render(
		<QueryClientProvider client={queryClient}>
			<OfficersLog />
		</QueryClientProvider>,
		{
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
		},
	);
	const logEl = await findByText("@560.60", {}, { timeout: 5000 });
	expect(logEl).toBeDefined();
	userEvent.click(logEl);
	expect(await findByText("This is a test log entry")).toBeDefined();
	await userEvent.click(await findByText("Clear"));
	expect(queryByText("This is a test log entry")).toBeNull();
	await userEvent.click(await findByText("New Log Entry"));
	const entryText = "This is a new log entry.";
	await userEvent.type(await findByRole("textbox"), entryText);
	await userEvent.click(await findByText("Save"));
	expect(netSendSpy).toHaveBeenCalledTimes(1);
});
