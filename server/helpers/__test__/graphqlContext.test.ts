import Client from "../../schema/client";
import App from "../../app";
import {getGraphQLContext} from "../graphqlContext";

describe("GraphQL Context", () => {
  it("should generate context from request headers", () => {
    const client = new Client({id: "Test Client"});
    App.storage.clients.push(client);
    expect(
      getGraphQLContext({
        req: {headers: {clientid: "Test Client"}} as any,
        res: {} as any,
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "client": Client {
          "connected": false,
          "id": "Test Client",
          "loginName": null,
          "offlineState": null,
          "shipId": null,
          "stationId": null,
          "training": false,
        },
        "clientId": "Test Client",
        "core": false,
        "flight": undefined,
        "ship": undefined,
      }
    `);
    expect(
      getGraphQLContext({
        req: undefined as any,
        res: {} as any,
        connection: {context: {clientid: "Test Client"}} as any,
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "client": Client {
          "connected": false,
          "id": "Test Client",
          "loginName": null,
          "offlineState": null,
          "shipId": null,
          "stationId": null,
          "training": false,
        },
        "clientId": "Test Client",
        "core": false,
        "flight": undefined,
        "ship": undefined,
      }
    `);
  });
});
