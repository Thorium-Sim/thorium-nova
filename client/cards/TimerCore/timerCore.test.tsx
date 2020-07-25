import {TimerCreateDocument, TimersDocument} from "../../generated/graphql";
import React from "react";
import {act, render, waitForElementToBeRemoved} from "test-utils";
import Timer from ".";
import userEvent from "@testing-library/user-event";

describe("Timer Core", () => {
  it("should render existing timers", async () => {
    const {findByText} = render(<Timer />, {
      mocks: [
        {
          request: {query: TimersDocument, variables: {}},
          result: {
            data: {
              timers: [
                {
                  id: "test",
                  components: {
                    timer: {
                      time: "00:05:00",
                      label: "My Timer",
                      paused: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });

    expect(await findByText("My Timer: 00:05:00")).toBeInTheDocument();
    expect(await findByText("Pause")).toBeInTheDocument();
  });
  it(
    "should create a new timer",
    async () => {
      const {findByText, findByDisplayValue} = render(<Timer />, {
        mocks: [
          {
            request: {query: TimersDocument, variables: {}},
            result: {
              data: {
                timers: [],
              },
            },
          },
          {
            request: {
              query: TimerCreateDocument,
              variables: {label: "Generic Timer", time: "05:00:00"},
            },
            result: {
              data: {
                timerCreate: {
                  id: "test",
                  components: {
                    timer: {
                      label: "Generic Timer",
                      time: "05:00:00",
                    },
                  },
                },
              },
            },
          },
        ],
      });
      expect(await findByText("New Timer")).toBeInTheDocument();
      userEvent.click(await findByText("New Timer"));
      expect(await findByText("What is the timer label?")).toBeInTheDocument();
      userEvent.click(await findByText("OK"));
      expect(await findByText("Enter the number of seconds:"));
      userEvent.click(await findByText("OK"));
      expect(await findByText("Enter the number of minutes:"));
      userEvent.click(await findByText("OK"));
      expect(await findByText("Enter the number of hours:"));
      userEvent.type(await findByDisplayValue("0"), "5");
      await act(async () => {
        userEvent.click(await findByText("OK"));
      });
    },
    15 * 1000,
  );
});
