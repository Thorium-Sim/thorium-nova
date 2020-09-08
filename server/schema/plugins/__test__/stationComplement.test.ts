import {gqlCall} from "../../../helpers/gqlCall";

describe("Station Complement plugin", () => {
  it("should properly query station complements", async () => {
    const plugin = await gqlCall({
      query: `mutation CreateUniverse($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Universe"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const empty = await gqlCall({
      query: `query StationComplement {
    stationComplements(pluginId:"${pluginId}") {
      id
      name
    }
  }`,
    });
    expect(empty.data?.stationComplements.length).toEqual(0);
    const create = await gqlCall({
      query: `mutation CreateComplement($name:String!) {
    stationComplementCreate(pluginId:"${pluginId}", name:$name) {
      id
      name
    }
  }`,
      variables: {name: "New Complement"},
    });

    expect(create.data?.stationComplementCreate.name).toEqual("New Complement");
    const full = await gqlCall({
      query: `query StationComplement {
    stationComplements(pluginId:"${pluginId}") {
      id
      name
    }
  }`,
    });

    expect(full.data?.stationComplements.length).toEqual(1);
    const id = full.data?.stationComplements[0].id;
    const complement = await gqlCall({
      query: `query StationComplement($id:ID!) {
    stationComplement(id:$id, pluginId:"${pluginId}") {
      id
      name
    }
  }`,
      variables: {id},
    });
    expect(complement.data?.stationComplement.name).toEqual("New Complement");
  });
  it("should fail to create a new complement when one exists", async () => {
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
    await gqlCall({
      query: `mutation CreateComplement($name:String!) {
    stationComplementCreate(name:$name, pluginId:"${pluginId}") {
      id
      name
    }
  }`,
      variables: {name: "New Complement"},
    });
    const create = await gqlCall({
      query: `mutation CreateComplement($name:String!) {
    stationComplementCreate(name:$name, pluginId:"${pluginId}") {
      id
      name
    }
  }`,
      variables: {name: "New Complement"},
    });
    expect(create.errors?.[0].message).toEqual(
      "A station complement with that name already exists."
    );
  });
});
