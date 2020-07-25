import React from "react";
import {render} from "test-utils";
import ClientApp from "../App";
import userEvent from "@testing-library/user-event";
import {
  ClientConnectDocument,
  ClientDisconnectDocument,
  FlightsDocument,
} from "../generated/graphql";

describe("App", () => {
  it("should render", async () => {
    const {findByText, getByText} = render(<ClientApp />, {
      mocks: [
        {
          request: {query: ClientConnectDocument, variables: {}},
          result: {data: {clientConnect: {id: "test", connected: true}}},
        },
        {
          request: {query: ClientDisconnectDocument, variables: {}},
          result: {data: {clientDisconnect: {id: "test", connected: false}}},
        },
        {
          request: {query: FlightsDocument, variables: {}},
          result: {data: {flights: []}},
        },
      ],
    });
    await findByText("Thorium Nova");
    expect(getByText("Thorium Nova")).toBeInTheDocument();
    expect(getByText("Start a New Flight")).toBeInTheDocument();
    expect(getByText("Load a Saved Flight")).toBeInTheDocument();
    expect(getByText("Join a Server")).toBeInTheDocument();
    expect(getByText("Alex Anderson 🚀")).toBeInTheDocument();
    const versionLink = getByText(
      `Version ${require("../../package.json").version}`,
    );
    expect(versionLink).toBeInTheDocument();
    userEvent.click(versionLink);
    await findByText("Release Notes");
    expect(getByText("Release Notes")).toBeInTheDocument();
  });
});
