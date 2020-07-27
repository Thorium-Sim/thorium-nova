import {TimerCreateDocument, TimersDocument} from "../../generated/graphql";
import React from "react";
import {act, render} from "test-utils";
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
});
