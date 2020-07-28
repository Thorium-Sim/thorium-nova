import {gqlCall} from "../../../helpers/gqlCall";

describe("Ship Plugin", () => {
  it("should query and get no results", async () => {
    const ships = await gqlCall({
      query: `query Ships {
      templateShips {
        id
        identity {
          name
        }
      }
    }`,
    });
    expect(ships.data?.templateShips).toEqual([]);
  });
  it("should query and get a template ship", async () => {
    await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Test Ship") {
          id
        }
      }`,
    });
    const ships = await gqlCall({
      query: `query Ships {
      templateShips {
        id
        identity {
          name
        }
      }
    }`,
    });

    expect(ships.data?.templateShips[0].identity.name).toEqual("Test Ship");
    const id = ships.data?.templateShips[0].id;
    const ship = await gqlCall({
      query: `query Ship($id:ID!) {
      templateShip(id:$id) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {id},
    });
    expect(ship.data?.templateShip.identity.name).toEqual("Test Ship");
  });

  it("should throw an error if a ship is created with the same name", async () => {
    await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Same Name") {
          id
        }
      }`,
    });
    const ship = await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Same Name") {
          id
        }
      }`,
    });

    expect(ship.errors?.[0].message).toEqual(
      "A ship with that name already exists.",
    );
  });
  it("should properly rename a ship", async () => {
    const newShip = await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Rename Ship") {
          id
          identity {
            name
          }
        }
      }`,
    });
    const id = newShip.data?.shipCreateTemplate.id;
    const renamedShip = await gqlCall({
      query: `mutation RenameShip($id:ID!, $name:String!) {
          templateShipRename(id:$id, name:$name) {
            id
            identity {
              name
            }
          }
        }`,
      variables: {id, name: "New Name"},
    });
    expect(renamedShip.data?.templateShipRename.identity.name).toEqual(
      "New Name",
    );
    expect(renamedShip.data?.templateShipRename.identity.name).not.toEqual(
      newShip.data?.shipCreateTemplate.identity.name,
    );
  });
  it("should fail to rename a ship with an invalid ID", async () => {
    const renamedShip = await gqlCall({
      query: `mutation RenameShip($id:ID!, $name:String!) {
          templateShipRename(id:$id, name:$name) {
            id
            identity {
              name
            }
          }
        }`,
      variables: {id: "Not a real ship", name: "New Name"},
    });
    expect(renamedShip.errors?.[0].message).toEqual("Unable to find ship.");
  });
  it("should fail to change the theme of a ship with an invalid ID", async () => {
    const rethemedShip = await gqlCall({
      query: `mutation ReThemeShip($id:ID!, $theme:String!) {
          templateShipSetTheme(id:$id, theme:$theme) {
            id
            theme {
              value
            }
          }
        }`,
      variables: {id: "Not a real ship", theme: "New Theme"},
    });
    expect(rethemedShip.errors?.[0].message).toEqual("Unable to find ship.");
  });
  it("should properly change the theme of a ship", async () => {
    const newShip = await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Retheme Ship") {
          id
          theme {
            value
          }
        }
      }`,
    });
    const id = newShip.data?.shipCreateTemplate.id;
    const rethemedShip = await gqlCall({
      query: `mutation ReThemeShip($id:ID!, $theme:String!) {
          templateShipSetTheme(id:$id, theme:$theme) {
            id
            theme {
              value
            }
          }
        }`,
      variables: {id, theme: "New Theme"},
    });

    expect(rethemedShip.data?.templateShipSetTheme.theme.value).toEqual(
      "New Theme",
    );
    expect(rethemedShip.data?.templateShipSetTheme.theme.value).not.toEqual(
      newShip.data?.shipCreateTemplate.theme.value,
    );
  });
});
