import {gqlCall} from "../../helpers/gqlCall";

describe("Flight Resolver", () => {
  it("should create a new flight", async () => {
    const flight = await gqlCall({
      query: `mutation Flights {
    flightStart(flightName:"Test Flight",plugins:[]) {
      id
      name
    }
  }`,
    });
    expect(flight.data?.flightStart.name).toEqual("Test Flight");
    const flights = await gqlCall({
      query: `query Flights {
    flight {
      id
      name
    }
  }`,
    });

    expect(flight.data?.flightStart).toEqual(flights.data?.flight);
  });
});
