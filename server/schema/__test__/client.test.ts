import Entity from "../../helpers/ecs/entity";
import App from "../../app";
import {gqlCall} from "../../helpers/gqlCall";
import Flight from "../flight";
import {IdentityComponent} from "../../components/identity";
import {IsShipComponent} from "../../components/isShip";
import {gql} from "@apollo/client";

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
  it("should fail to attach to a ship that does not exist", async () => {
    const connectedClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });
    const setShip = await gqlCall({
      query: `mutation Ship($shipId:ID!) {
        clientSetShip(shipId:$shipId) {
          id
        }
      }`,
      variables: {shipId: "Test Ship"},
    });
    expect(setShip.errors?.[0].message).toEqual(
      "Selected Ship is not present on the flight."
    );
  });
  it("should succeed to attach when a ship does exist.", async () => {
    const connectedClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });
    App.activeFlight = new Flight();
    const ship = new Entity("Test Ship", [IdentityComponent, IsShipComponent]);
    App.activeFlight.ecs.addEntity(ship);

    const setShip = await gqlCall({
      query: `mutation Ship($shipId:ID!) {
        clientSetShip(shipId:$shipId) {
          id
          ship {
            id
          }
        }
      }`,
      variables: {shipId: "Test Ship"},
    });

    expect(setShip.data?.clientSetShip.ship.id).toEqual("Test Ship");
    App.activeFlight = null;
  });
  it.skip("should succeed to attach a station.", async () => {
    App.activeFlight = new Flight();
    const ship = new Entity("Test Ship", [IdentityComponent, IsShipComponent]);
    App.activeFlight.ecs.addEntity(ship);

    const connectedClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          connected
        }
      }`,
    });

    const setShip = await gqlCall({
      query: `mutation Ship($shipId:ID!) {
        clientSetShip(shipId:$shipId) {
          id
          ship {
            id
          }
        }
      }`,
      variables: {shipId: "Test Ship"},
    });

    expect(setShip.data?.clientSetShip.ship.id).toEqual("Test Ship");
    App.activeFlight = null;
  });
  it("should login a client", async () => {
    const connectedClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          loginName
        }
      }`,
    });
    expect(connectedClient.data?.clientConnect.loginName).toEqual(null);

    const loginClient = await gqlCall({
      query: `mutation Login($loginName:String!) {
        clientLogin(loginName:$loginName) {
          id
          loginName
        }
      }`,
      variables: {loginName: "Test Name"},
    });

    expect(loginClient.data?.clientLogin.loginName).toEqual("Test Name");
  });
  it("should log a client out", async () => {
    const connectedClient = await gqlCall({
      query: `mutation Create {
        clientConnect {
          id
          loginName
        }
      }`,
    });
    const loginClient = await gqlCall({
      query: `mutation Login($loginName:String!) {
        clientLogin(loginName:$loginName) {
          id
          loginName
        }
      }`,
      variables: {loginName: "Test Name"},
    });

    expect(loginClient.data?.clientLogin.loginName).toEqual("Test Name");

    const logoutClient = await gqlCall({
      query: `mutation Login {
        clientLogout {
          id
          loginName
        }
      }`,
    });
    expect(logoutClient.data?.clientLogout.loginName).toEqual(null);
  });
});
