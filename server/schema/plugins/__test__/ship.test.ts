import {gqlCall} from "../../../helpers/gqlCall";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";

const fs = jest.genMockFromModule("fs") as any;

describe("Ship Plugin", () => {
  it("should query and get no results", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const ships = await gqlCall({
      query: `query Ships($pluginId:ID!) {
      pluginShips(pluginId:$pluginId) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {pluginId},
    });
    expect(ships.data?.pluginShips).toEqual([]);
  });
  it("should query and get a template ship", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 2"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const result = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Test Ship", pluginId:$pluginId) {
          id
        }
      }`,
      variables: {pluginId},
    });

    const ships = await gqlCall({
      query: `query Ships($pluginId:ID!) {
      pluginShips(pluginId:$pluginId) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {pluginId},
    });
    expect(ships.data?.pluginShips[0].identity.name).toEqual("Test Ship");
    const id = ships.data?.pluginShips[0].id;
    const ship = await gqlCall({
      query: `query Ship($id:ID!, $pluginId:ID!) {
      pluginShip(id:$id, pluginId:$pluginId) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {id, pluginId},
    });
    expect(ship.data?.pluginShip.identity.name).toEqual("Test Ship");
  });

  it("should throw an error if a ship is created with the same name", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 3"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Same Name", pluginId:$pluginId) {
          id
        }
      }`,
      variables: {pluginId},
    });
    const ship = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Same Name", pluginId:$pluginId) {
          id
        }
      }`,
      variables: {pluginId},
    });
    expect(ship.errors?.[0].message).toEqual(
      "A ship with that name already exists."
    );
  });
  it("should remove a ship", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
          pluginCreate(name:$name) {
            id
            name
          }
        }`,
      variables: {name: "My Plugin 10"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
          pluginShipCreate(name:"Remove Ship", pluginId:$pluginId) {
            id
            identity {
              name
            }
          }
        }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    const output = await gqlCall({
      query: `mutation RemoveShip($pluginId:ID!, $id:ID!) {
            pluginShipRemove(shipId:$id, pluginId:$pluginId)
          }`,
      variables: {id, pluginId},
    });
    const ships = await gqlCall({
      query: `query Ship($pluginId:ID!) {
        pluginShips(pluginId:$pluginId) {
          id
          identity {
            name
          }
        }
      }`,
      variables: {pluginId},
    });
    expect(ships.data?.pluginShips.length).toEqual(0);
  });
  it("should properly rename a ship", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 4"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Rename Ship", pluginId:$pluginId) {
          id
          identity {
            name
          }
        }
      }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    const renamedShip = await gqlCall({
      query: `mutation RenameShip($pluginId:ID!, $id:ID!, $name:String!) {
          pluginShipRename(id:$id, name:$name, pluginId:$pluginId) {
            id
            identity {
              name
            }
          }
        }`,
      variables: {id, name: "New Name", pluginId},
    });
    expect(renamedShip.data?.pluginShipRename.identity.name).toEqual(
      "New Name"
    );
    expect(renamedShip.data?.pluginShipRename.identity.name).not.toEqual(
      newShip.data?.pluginShipCreate.identity.name
    );
  });
  it("should fail to rename a ship with an invalid ID", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 5"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const renamedShip = await gqlCall({
      query: `mutation RenameShip($id:ID!, $name:String!, $pluginId:ID!) {
          pluginShipRename(id:$id, name:$name, pluginId:$pluginId) {
            id
            identity {
              name
            }
          }
        }`,
      variables: {id: "Not a real ship", name: "New Name", pluginId},
    });
    expect(renamedShip.errors?.[0].message).toEqual("Unable to find ship.");
  });
  it("should fail to change the theme of a ship with an invalid ID", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 6"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const rethemedShip = await gqlCall({
      query: `mutation ReThemeShip($id:ID!, $theme:String!, $pluginId:ID!) {
          pluginShipSetTheme(id:$id, theme:$theme, pluginId:$pluginId) {
            id
            theme {
              value
            }
          }
        }`,
      variables: {id: "Not a real ship", theme: "New Theme", pluginId},
    });
    expect(rethemedShip.errors?.[0].message).toEqual("Unable to find ship.");
  });
  it("should properly change the theme of a ship", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 7"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Retheme Ship",pluginId:$pluginId) {
          id
          theme {
            value
          }
        }
      }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    const rethemedShip = await gqlCall({
      query: `mutation ReThemeShip($id:ID!, $theme:String!, $pluginId:ID!) {
          pluginShipSetTheme(id:$id, theme:$theme,pluginId:$pluginId) {
            id
            theme {
              value
            }
          }
        }`,
      variables: {id, theme: "New Theme", pluginId},
    });

    expect(rethemedShip.data?.pluginShipSetTheme.theme.value).toEqual(
      "New Theme"
    );
    expect(rethemedShip.data?.pluginShipSetTheme.theme.value).not.toEqual(
      newShip.data?.pluginShipCreate.theme.value
    );
  });
  it("should properly add and query for ship assets", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Plugin 9"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Asset Ship", pluginId:$pluginId) {
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
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    expect(newShip.data?.pluginShipCreate.shipAssets.logo).toBeFalsy();

    const file = fs.createReadStream(path.resolve(__dirname, `./logo.svg`));

    const upload = new Upload();
    const assetChangePromise = gqlCall({
      query: `mutation SetLogo($id:ID!, $image:Upload!, $pluginId:ID!) {
        pluginShipSetLogo(id:$id, image:$image, pluginId:$pluginId) {
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
        pluginId,
      },
    });
    upload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "logo.svg",
      mimetype: `image/svg+xml`,
    });

    const assetChange = await assetChangePromise;
    expect(assetChange.data?.pluginShipSetLogo.shipAssets.logo).toEqual(
      "/ship/Asset Ship/logo.svg"
    );

    const modelUpload = new Upload();
    const modelChangePromise = gqlCall({
      query: `mutation SetModel($id:ID!, $model:Upload!, $top:Upload!, $side:Upload!, $vanity:Upload!, $pluginId:ID!) {
        pluginShipSetModel(id:$id, model:$model, top:$top, side:$side, vanity:$vanity, pluginId:$pluginId) {
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
        pluginId,
      },
    });
    modelUpload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "testFile",
      mimetype: `image/svg+xml`,
    });

    const modelChange = await modelChangePromise;
    expect(modelChange.data?.pluginShipSetModel.shipAssets.model).toEqual(
      "/ship/Asset Ship/model.glb"
    );
    expect(modelChange.data?.pluginShipSetModel.shipAssets.vanity).toEqual(
      "/ship/Asset Ship/vanity.png"
    );
    expect(modelChange.data?.pluginShipSetModel.shipAssets.top).toEqual(
      "/ship/Asset Ship/top.png"
    );
    expect(modelChange.data?.pluginShipSetModel.shipAssets.side).toEqual(
      "/ship/Asset Ship/side.png"
    );
  });
  it("should update the basic properties of the ship", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Ship Plugin 9"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
        pluginShipCreate(name:"Asset Ship", pluginId:$pluginId) {
          id
          identity {
            name
            description
          }
          tags {
            tags
          }
        }
      }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    expect(newShip.data?.pluginShipCreate.identity.name).toEqual("Asset Ship");
    expect(newShip.data?.pluginShipCreate.identity.description).toEqual("");
    expect(newShip.data?.pluginShipCreate.tags.tags.length).toEqual(0);
    const updatedShip = await gqlCall({
      query: `mutation Update($pluginId:ID!, $shipId:ID!) {
        pluginShipSetDescription(description:"Ship description", pluginId:$pluginId, shipId:$shipId) {
          id
          identity {
            name
            description
          }
          tags {
            tags
          }
        }
        pluginShipSetName(name:"Named Ship", pluginId:$pluginId, shipId:$shipId) {
          id
          identity {
            name
            description
          }
          tags {
            tags
          }
        }
        pluginShipSetTags(tags:["Test"], pluginId:$pluginId, shipId:$shipId) {
          id
          identity {
            name
            description
          }
          tags {
            tags
          }
        }
      
      }`,
      variables: {pluginId, shipId: id},
    });
    expect(updatedShip.data?.pluginShipSetTags.identity.name).toEqual(
      "Named Ship"
    );
    expect(updatedShip.data?.pluginShipSetTags.identity.description).toEqual(
      "Ship description"
    );
    expect(updatedShip.data?.pluginShipSetTags.tags.tags.length).toEqual(1);
    expect(updatedShip.data?.pluginShipSetTags.tags.tags[0]).toEqual("Test");
  });
  it("should update the physics properties", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
      pluginCreate(name:$name) {
        id
        name
      }
    }`,
      variables: {name: "My Ship Plugin 1"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
      pluginShipCreate(name:"Test Ship", pluginId:$pluginId) {
        id
        size{value}
        isShip{mass}
      }
    }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    expect(newShip.data?.pluginShipCreate.isShip.mass).toEqual(2000);
    expect(newShip.data?.pluginShipCreate.size.value).toEqual(1);
    const updatedShip = await gqlCall({
      query: `mutation Update($pluginId:ID!, $shipId:ID!) {
      pluginShipSetMass(mass:50, pluginId:$pluginId, shipId:$shipId) {
        id
        size{value}
        isShip{mass}
      }
      pluginShipSetSize(size:51, pluginId:$pluginId, shipId:$shipId) {
        id
        size{value}
        isShip{mass}
      }
    }`,
      variables: {pluginId, shipId: id},
    });
    expect(updatedShip.data?.pluginShipSetSize.isShip.mass).toEqual(50);
    expect(updatedShip.data?.pluginShipSetSize.size.value).toEqual(51);
  });
  it("should add and remove existing outfits", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
      pluginCreate(name:$name) {
        id
        name
      }
    }`,
      variables: {name: "My Ship Plugin 2"},
    });
    const pluginId = plugin.data?.pluginCreate.id;

    const newShip = await gqlCall({
      query: `mutation AddShip($pluginId:ID!) {
      pluginShipCreate(name:"Test Ship", pluginId:$pluginId) {
        id
        shipOutfits {
          outfitIds
        }
      }
    }`,
      variables: {pluginId},
    });
    const id = newShip.data?.pluginShipCreate.id;
    expect(newShip.data?.pluginShipCreate.shipOutfits.outfitIds.length).toEqual(
      0
    );
    const newOutfit = await gqlCall({
      query: `mutation AddOutfit($pluginId:ID!) {
        pluginAddOutfit(pluginId:$pluginId,  ability:thrusters) {
          id
        }
      }`,
      variables: {pluginId},
    });
    const outfitId = newOutfit.data?.pluginAddOutfit.id;

    const shipAddOutfit = await gqlCall({
      query: `mutation ShipAddOutfit($pluginId:ID!, $shipId:ID!, $outfitId:ID!) {
        pluginShipAddOutfit(pluginId:$pluginId, shipId:$shipId, outfitId:$outfitId) {
          id
          shipOutfits {
            outfits {
              id
              isOutfit {
                outfitType
              }
            }
          }
        }
      }`,
      variables: {shipId: id, pluginId, outfitId},
    });
    expect(
      shipAddOutfit.data?.pluginShipAddOutfit.shipOutfits.outfits.length
    ).toEqual(1);
    expect(
      shipAddOutfit.data?.pluginShipAddOutfit.shipOutfits.outfits[0].isOutfit
        .outfitType
    ).toEqual("thrusters");
    const shipRemoveOutfit = await gqlCall({
      query: `mutation ShipAddOutfit($pluginId:ID!, $shipId:ID!, $outfitId:ID!) {
        pluginShipRemoveOutfit(pluginId:$pluginId, shipId:$shipId, outfitId:$outfitId) {
          id
          shipOutfits {
            outfits {
              id
              isOutfit {
                outfitType
              }
            }
          }
        }
      }`,
      variables: {shipId: id, pluginId, outfitId},
    });
    expect(
      shipRemoveOutfit.data?.pluginShipRemoveOutfit.shipOutfits.outfits.length
    ).toEqual(0);
  });
});
