import {gqlCall} from "server/helpers/gqlCall";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";
import {getPlanetId} from "./utils";

const fs = jest.genMockFromModule("fs") as any;
describe("Universe Plugin", () => {
  it("should query and get no results", async () => {
    const universes = await gqlCall({
      query: `query Universe {
        plugins {
          id
          name
        }
      }`,
    });
    expect(universes.data?.plugins.length).toEqual(0);
  });
  it("should create a universe", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });

    expect(universe.data?.pluginCreate.name).toEqual("My Universe");
    const id = universe.data?.pluginCreate.id;
    const universes = await gqlCall({
      query: `query Universe {
        plugins {
          id
          name
        }
      }`,
    });
    expect(universes.data?.plugins.length).toEqual(1);
    expect(universes.data?.plugins[0].name).toEqual("My Universe");

    const universeFail = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });
    expect(universeFail.errors?.[0].message).toEqual(
      "A plugin with that name already exists."
    );

    await gqlCall({
      query: `mutation RemoveUniverse($id:ID!) {
        pluginRemove(id:$id)
      }`,
      variables: {id},
    });
  });
  it("should remove a universe", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe 2"},
    });
    const id = universe.data?.pluginCreate.id;
    const queryUniverse = await gqlCall({
      query: `query Universe($id:ID!) {
        plugin(id:$id) {
          id
          name
        }
      }`,
      variables: {id},
    });

    expect(queryUniverse.data?.plugin.name).toEqual("My Universe 2");

    await gqlCall({
      query: `mutation RemoveUniverse($id:ID!) {
        pluginRemove(id:$id)
      }`,
      variables: {id},
    });

    const universes = await gqlCall({
      query: `query Universe {
        plugins {
          id
          name
        }
      }`,
    });
    expect(universes.data?.plugins.length).toEqual(0);
  });
  it("should fail to set a duplicate name", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });
    const id = universe.data?.pluginCreate.id;

    const universeFail = await gqlCall({
      query: `mutation SetName($id:ID!, $name:String!) {
        pluginSetName(id:$id, name:$name) {
          id
        }
      }`,
      variables: {
        id,
        name: "My Universe",
      },
    });
    expect(universeFail.errors?.[0].message).toEqual(
      "A plugin with that name already exists."
    );
  });
  it("should set name, description, and tags", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe 3"},
    });
    const id = universe.data?.pluginCreate.id;
    const queryUniverse = await gqlCall({
      query: `query Universe($id:ID!) {
        plugin(id:$id) {
          id
          name
          description
          tags
        }
      }`,
      variables: {id},
    });
    expect(queryUniverse.data?.plugin.name).toEqual("My Universe 3");
    expect(queryUniverse.data?.plugin.description).toEqual("A great plugin");
    expect(queryUniverse.data?.plugin.tags.length).toEqual(0);

    await gqlCall({
      query: `mutation SetName($id:ID!, $name:String!, $description:String!, $tags:[String!]!) {
        pluginSetName(id:$id, name:$name) {
          id
        }
        pluginSetDescription(id:$id, description:$description) {
          id
        }
        pluginSetTags(id:$id, tags:$tags) {
          id
        }
      }`,
      variables: {
        id,
        name: "A new name",
        description: "A great description",
        tags: ["tag1", "tag2"],
      },
    });

    const queryUniverse2 = await gqlCall({
      query: `query Universe($id:ID!) {
        plugin(id:$id) {
          id
          name
          description
          tags
        }
      }`,
      variables: {id},
    });
    expect(queryUniverse2.data?.plugin.name).toEqual("A new name");
    expect(queryUniverse2.data?.plugin.description).toEqual(
      "A great description"
    );
    expect(queryUniverse2.data?.plugin.tags.length).toEqual(2);
    expect(queryUniverse2.data?.plugin.tags).toContain("tag1");
    expect(queryUniverse2.data?.plugin.tags).toContain("tag2");
  });
  it("should properly add and query for a cover image", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
          coverImage
        }
      }`,
      variables: {name: "My Universe 4"},
    });
    const id = universe.data?.pluginCreate.id;
    expect(universe.data?.pluginCreate.coverImage).toBeFalsy();

    const file = fs.createReadStream(path.resolve(__dirname, `./logo.svg`));

    const upload = new Upload();
    const assetChangePromise = gqlCall({
      query: `mutation setCoverImage($id:ID!, $image:Upload!) {
        pluginSetCoverImage(id:$id, image:$image) {
          id
          coverImage
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
    expect(assetChange.data?.pluginSetCoverImage.coverImage).toEqual(
      "/assets/plugins/My Universe 4/cover.svg"
    );
  });
  it("should search for a planet", async () => {
    const {id, planetId, planet} = await getPlanetId();

    const search = await gqlCall({
      query: `query Search($id:ID!, $search:String!) {
        pluginUniverseSearch(id:$id, search:$search) {
          id
          identity {
            name
          }
        }
      }`,
      variables: {
        id,
        search: planet.identity.name,
      },
    });
    expect(search.data?.pluginUniverseSearch[0]).toEqual(planet);
  });
});
