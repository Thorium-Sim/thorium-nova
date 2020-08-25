import {gqlCall} from "server/helpers/gqlCall";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";

const fs = jest.genMockFromModule("fs") as any;
describe("Universe Plugin", () => {
  it("should query and get no results", async () => {
    const universes = await gqlCall({
      query: `query Universe {
        templateUniverses {
          id
          name
        }
      }`,
    });
    expect(universes.data?.templateUniverses.length).toEqual(0);
  });
  it("should create a universe", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });

    expect(universe.data?.universeCreate.name).toEqual("My Universe");
    const id = universe.data?.universeCreate.id;
    const universes = await gqlCall({
      query: `query Universe {
        templateUniverses {
          id
          name
        }
      }`,
    });
    expect(universes.data?.templateUniverses.length).toEqual(1);
    expect(universes.data?.templateUniverses[0].name).toEqual("My Universe");

    const universeFail = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });
    expect(universeFail.errors?.[0].message).toEqual(
      "A universe with that name already exists."
    );

    await gqlCall({
      query: `mutation RemoveUniverse($id:ID!) {
        universeRemove(id:$id)
      }`,
      variables: {id},
    });
  });
  it("should remove a universe", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe 2"},
    });
    const id = universe.data?.universeCreate.id;
    const queryUniverse = await gqlCall({
      query: `query Universe($id:ID!) {
        templateUniverse(id:$id) {
          id
          name
        }
      }`,
      variables: {id},
    });

    expect(queryUniverse.data?.templateUniverse.name).toEqual("My Universe 2");

    await gqlCall({
      query: `mutation RemoveUniverse($id:ID!) {
        universeRemove(id:$id)
      }`,
      variables: {id},
    });

    const universes = await gqlCall({
      query: `query Universe {
        templateUniverses {
          id
          name
        }
      }`,
    });
    expect(universes.data?.templateUniverses.length).toEqual(0);
  });
  it("should fail to set a duplicate name", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });
    const id = universe.data?.universeCreate.id;

    const universeFail = await gqlCall({
      query: `mutation SetName($id:ID!, $name:String!) {
        universeSetName(id:$id, name:$name) {
          id
        }
      }`,
      variables: {
        id,
        name: "My Universe",
      },
    });
    expect(universeFail.errors?.[0].message).toEqual(
      "A universe with that name already exists."
    );
  });
  it("should set name, description, and tags", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe 3"},
    });
    const id = universe.data?.universeCreate.id;
    const queryUniverse = await gqlCall({
      query: `query Universe($id:ID!) {
        templateUniverse(id:$id) {
          id
          name
          description
          tags
        }
      }`,
      variables: {id},
    });
    expect(queryUniverse.data?.templateUniverse.name).toEqual("My Universe 3");
    expect(queryUniverse.data?.templateUniverse.description).toEqual(
      "A great plugin"
    );
    expect(queryUniverse.data?.templateUniverse.tags.length).toEqual(0);

    await gqlCall({
      query: `mutation SetName($id:ID!, $name:String!, $description:String!, $tags:[String!]!) {
        universeSetName(id:$id, name:$name) {
          id
        }
        universeSetDescription(id:$id, description:$description) {
          id
        }
        universeSetTags(id:$id, tags:$tags) {
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
        templateUniverse(id:$id) {
          id
          name
          description
          tags
        }
      }`,
      variables: {id},
    });
    expect(queryUniverse2.data?.templateUniverse.name).toEqual("A new name");
    expect(queryUniverse2.data?.templateUniverse.description).toEqual(
      "A great description"
    );
    expect(queryUniverse2.data?.templateUniverse.tags.length).toEqual(2);
    expect(queryUniverse2.data?.templateUniverse.tags).toContain("tag1");
    expect(queryUniverse2.data?.templateUniverse.tags).toContain("tag2");
  });
  it("should properly add and query for a cover image", async () => {
    const universe = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        universeCreate(name:$name) {
          id
          name
          coverImage
        }
      }`,
      variables: {name: "My Universe 4"},
    });
    const id = universe.data?.universeCreate.id;
    expect(universe.data?.universeCreate.coverImage).toBeFalsy();

    const file = fs.createReadStream(path.resolve(__dirname, `./logo.svg`));

    const upload = new Upload();
    const assetChangePromise = gqlCall({
      query: `mutation setCoverImage($id:ID!, $image:Upload!) {
        universeSetCoverImage(id:$id, image:$image) {
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
    expect(assetChange.data?.universeSetCoverImage.coverImage).toEqual(
      "/assets/universes/My Universe 4/cover.svg"
    );
  });
});
