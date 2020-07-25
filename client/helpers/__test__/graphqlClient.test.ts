import client from "../graphqlClient";

describe("graphQL Client", () => {
  it("should load correctly without error", () => {
    expect(client).toBeTruthy();
  });
});
