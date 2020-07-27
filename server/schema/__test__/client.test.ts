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
    const otherClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });
    expect(otherClient).toEqual({
      data: {
        clientConnect: {
          id: result.data?.client.id,
          connected: true,
        },
      },
    });
  });
  it("should disconnect a client", async () => {
    await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });
    const client = await gqlCall({
      query: `mutation Disconnect {
        clientDisconnect {
          id
          connected
        }
      }`,
    });
    expect(client.data?.clientDisconnect.connected).toEqual(false);
  });
  it("should fail to find a client with an invalid ID", async () => {
    const client = await gqlCall({
      query: `query Client($id:ID!) {
        client(id:$id) {
          id
        }
      }`,
      variables: {id: "Whatever"},
    });
    expect(client.errors?.[0].message).toEqual("Whatever");
  });
});
