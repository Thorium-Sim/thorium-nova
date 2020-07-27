import App from "../../app";
import {gqlCall} from "../../helpers/gqlCall";
import Flight from "../flight";
describe("Ship Resolver", () => {
  describe("Queries", () => {
    it("should return blank when there is no active flight", async () => {
      const ships = await gqlCall({
        query: `query Ships {
        ships {
          id
        }
      }`,
      });
      expect(ships.data?.ships.length).toEqual(0);
      const firstShip = await gqlCall({
        query: `query Ship{
        ship {
          id
          theme {
            value
          }
        }
      }`,
      });
      expect(firstShip.errors?.[0].message).toEqual(
        "ID is a required parameter",
      );
      const ship = await gqlCall({
        query: `query Ship($id:ID!){
        ship(id:$id) {
          id
          theme {
            value
          }
        }
      }`,
        variables: {id: "Test"},
      });
      expect(ship.errors?.[0].message).toEqual("Unable to find ship.");
    });
    it("should return a single ship when one is created.", async () => {
      App.activeFlight = new Flight();
      await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
      }
    }`,
        variables: {name: "Test Ship"},
      });
      const ships = await gqlCall({
        query: `query Ships {
        ships {
          id
        }
      }`,
      });
      expect(ships.data?.ships.length).toEqual(1);
      App.activeFlight = null;
    });
  });
  describe("Mutations", () => {
    beforeEach(() => {
      App.activeFlight = new Flight();
    });
    afterEach(() => {
      () => {
        App.activeFlight = null;
      };
    });
    it("should create a ship", async () => {
      const ship = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        identity {
          name
        }
        isShip {
          value
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });
      expect(ship.data?.shipCreate.identity.name).toEqual("Test Ship");
      expect(ship.data?.shipCreate.isShip).toBeTruthy();
    });
    it("should fail to create a ship when there is no active flight", async () => {
      App.activeFlight = null;
      const otherShip = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        identity {
          name
        }
        isShip {
          value
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });

      expect(otherShip.data?.shipCreate).toEqual(null);
    });
    it("should rename a ship", async () => {
      const ship = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        identity {
          name
        }
        isShip {
          value
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });
      const id = ship.data?.shipCreate.id;
      const renamedShip = await gqlCall({
        query: `mutation RenameShip($id:ID!, $name:String!){
      shipRename(id:$id, name:$name) {
        id
        identity {
          name
        }
        isShip {
          value
        }
      }
    }`,
        variables: {id, name: "Renamed Ship"},
      });
      expect(renamedShip.data?.shipRename.identity.name).toEqual(
        "Renamed Ship",
      );
    });
    it("should update the theme of the ship", async () => {
      const ship = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        theme {
          value
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });
      const id = ship.data?.shipCreate.id;
      expect(ship.data?.shipCreate.theme.value).toEqual("default");
      await gqlCall({
        query: `mutation ShipTheme($id:ID!, $theme:String!){
      shipSetTheme(id:$id, theme:$theme) {
        id
        theme {
          value
        }
      }
    }`,
        variables: {id, theme: "Test Theme"},
      });
      const newShip = await gqlCall({
        query: `query Ship($id:ID!){
        ship(id:$id) {
          id
          theme {
            value
          }
        }
      }`,
        variables: {id},
      });
      expect(newShip.data?.ship.theme.value).toEqual("Test Theme");
    });
    it("should update the alert level of the ship", async () => {
      const ship = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        alertLevel {
          alertLevel
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });
      const id = ship.data?.shipCreate.id;
      expect(ship.data?.shipCreate.alertLevel.alertLevel).toEqual("5");
      const result = await gqlCall({
        query: `mutation AlertLevel($id:ID!, $alertLevel:String!){
        shipSetAlertLevel(id:$id, alertLevel:$alertLevel) {
          id
          alertLevel {
            alertLevel
          }
        }
      }`,
        variables: {id, alertLevel: "1"},
      });
      const newShip = await gqlCall({
        query: `query Ship($id:ID!){
        ship(id:$id) {
          id
          alertLevel {
            alertLevel
          }
        }
      }`,
        variables: {id},
      });

      expect(newShip.data?.ship.alertLevel.alertLevel).toEqual("1");
    });
  });
  describe("Subscriptions", () => {
    beforeEach(() => {
      App.activeFlight = new Flight();
    });
    afterEach(() => {
      () => {
        App.activeFlight = null;
      };
    });
    it("should subscribe to an individual ship", async () => {
      const ship = await gqlCall({
        query: `mutation CreateShip($name:String!){
      shipCreate(name:$name) {
        id
        identity {
          name
        }
        isShip {
          value
        }
      }
    }`,
        variables: {name: "Test Ship"},
      });
      const id = ship.data?.shipCreate.id;

      const sub = await gqlCall({
        query: `subscription Ship($id:ID!){
        ship(id:$id) {
          id
          alertLevel {
            alertLevel
          }
        }
      }`,
        variables: {id},
      });
      console.log(sub);
    });
  });
});
