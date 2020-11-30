import React from "react";
import {render} from "test-utils";
// import ClientApp from "../App";
import ClientApp from "../pages/index";
import userEvent from "@testing-library/user-event";
import {
  ClientConnectDocument,
  ClientDisconnectDocument,
  FlightDocument,
  FlightsDocument,
} from "../generated/graphql";

describe("App", () => {
  it.skip("should render", async () => {
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
          result: {
            data: {
              flights: [
                {
                  id: "test",
                  name: "Test Flight",
                  date: new Date("January 1, 1993"),
                },
              ],
            },
          },
        },
        {
          request: {query: FlightDocument, variables: {}},
          result: {
            data: {
              flight: null,
            },
          },
        },
      ],
    });
    await findByText("Thorium Nova");
    expect(getByText("Thorium Nova")).toBeInTheDocument();
    expect(getByText("Quick Start")).toBeInTheDocument();
    expect(getByText("Custom Flight")).toBeInTheDocument();
    expect(getByText("Load a Saved Flight")).toBeInTheDocument();
    expect(getByText("Join a Server")).toBeInTheDocument();
    expect(getByText("Alex Anderson 🚀")).toBeInTheDocument();
    userEvent.click(getByText("Load a Saved Flight"));
    expect(await findByText("Test Flight")).toBeInTheDocument();
    expect(await findByText("1/1/1993")).toBeInTheDocument();

    const versionLink = getByText(
      `Version ${require("../../package.json").version}`
    );
    expect(versionLink).toBeInTheDocument();
    userEvent.click(versionLink);
    await findByText("Release Notes");
    expect(getByText("Release Notes")).toBeInTheDocument();
  });
});
