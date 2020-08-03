import {gqlCall} from "../../../helpers/gqlCall";
import path from "path";
// @ts-ignore
import Upload from "graphql-upload/public/upload";

const fs = jest.genMockFromModule("fs") as any;

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
  it("should properly add and query for ship assets", async () => {
    const newShip = await gqlCall({
      query: `mutation AddShip {
        shipCreateTemplate(name:"Asset Ship") {
          id
          shipAssets {
            logo
            model
            side
            top
            vanity
          }
        }
      }`,
    });
    const id = newShip.data?.shipCreateTemplate.id;
    expect(newShip.data?.shipCreateTemplate.shipAssets.logo).toBeFalsy();

    const file = fs.createReadStream(path.resolve(__dirname, `./logo.svg`));

    const upload = new Upload();
    const assetChangePromise = gqlCall({
      query: `mutation SetLogo($id:ID!, $image:Upload!) {
        templateShipSetLogo(id:$id, image:$image) {
          id
          shipAssets {
            logo
            model
            side
            top
            vanity
          }
        }
      }`,
      variables: {
        id,
        image: upload,
      },
    });
    upload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "logo.svg",
      mimetype: `image/svg+xml`,
    });

    const assetChange = await assetChangePromise;
    expect(assetChange.data?.templateShipSetLogo.shipAssets.logo).toEqual(
      "/assets/ships/Asset Ship/logo.svg",
    );

    const modelUpload = new Upload();
    const modelChangePromise = gqlCall({
      query: `mutation SetModel($id:ID!, $model:Upload!, $top:Upload!, $side:Upload!, $vanity:Upload!) {
        templateShipSetModel(id:$id, model:$model, top:$top, side:$side, vanity:$vanity) {
          id
          shipAssets {
            logo
            model
            side
            top
            vanity
          }
        }
      }`,
      variables: {
        id,
        model: modelUpload,
        top: modelUpload,
        side: modelUpload,
        vanity: modelUpload,
      },
    });
    modelUpload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "testFile",
      mimetype: `image/svg+xml`,
    });

    const modelChange = await modelChangePromise;
    expect(modelChange.data?.templateShipSetModel.shipAssets.model).toEqual(
      "/assets/ships/Asset Ship/model.glb",
    );
    expect(modelChange.data?.templateShipSetModel.shipAssets.vanity).toEqual(
      "/assets/ships/Asset Ship/vanity.png",
    );
    expect(modelChange.data?.templateShipSetModel.shipAssets.top).toEqual(
      "/assets/ships/Asset Ship/top.png",
    );
    expect(modelChange.data?.templateShipSetModel.shipAssets.side).toEqual(
      "/assets/ships/Asset Ship/side.png",
    );
  });
});
