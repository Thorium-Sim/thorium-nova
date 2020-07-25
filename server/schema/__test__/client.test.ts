import {gqlCall} from "../../helpers/gqlCall";

describe("Client Resolver", () => {
  it("should connect a client", async () => {
    const client = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });
    const result = await gqlCall({
      query: `query Client {
      client {
        id
        connected
      }
    }`,
    });
    expect(result.data?.client).toEqual(client.data?.clientConnect);
  });
});
