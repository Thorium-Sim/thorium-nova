import {gqlCall} from "server/helpers/gqlCall";

async function getSystem() {
  const universe = await gqlCall({
    query: `mutation CreateUniverse {
    universeCreate(name:"Test Universe${Math.random()}") {
      id
    }
  }`,
  });
  const id = universe.data?.universeCreate.id;
  const system = await gqlCall({
    query: `mutation CreateSystem($id:ID!) {
    pluginUniverseAddSystem(id:$id, position:{x:0,y:0,z:0}) {
      id
      identity {
        name
      }
    }
  }`,
    variables: {id},
  });
  const systemId = system.data?.pluginUniverseAddSystem.id;
  return {id, system, systemId};
}
describe("universe systems", () => {
  it("should properly query a system", async () => {
    const {id, system, systemId} = await getSystem();

    const querySystem = await gqlCall({
      query: `query System($id:ID!, $systemId:ID!) {
        pluginUniverseSystem(id:$id, systemId:$systemId) {
          id
          items {
            id
          }
          identity {
            name
          }
          habitableZoneInner
          habitableZoneOuter
        }
      }`,
      variables: {id, systemId},
    });

    expect(system.data?.pluginUniverseAddSystem.identity.name).toEqual(
      querySystem.data?.pluginUniverseSystem.identity.name
    );
    expect(
      querySystem.data?.pluginUniverseSystem.habitableZoneOuter
    ).toBeTruthy();
    expect(
      querySystem.data?.pluginUniverseSystem.habitableZoneInner
    ).toBeTruthy();
  });
  it("should set the name of the system", async () => {
    const {id, systemId} = await getSystem();
    const universe = await gqlCall({
      query: `mutation ChangeSystem($id:ID!, $systemId:ID!, $name:String!) {
      pluginUniverseSystemSetName(id:$id, systemId:$systemId, name:$name) {
        id
        systems {
          id
          identity {
            name
          }
        }
      }
    }`,
      variables: {id, systemId, name: "Test Name"},
    });
    const system = universe.data?.pluginUniverseSystemSetName.systems.find(
      (s: {id: string}) => s.id === systemId
    );
    expect(system.identity.name).toEqual("Test Name");
  });
  it("should set the description of the system", async () => {
    const {id, systemId} = await getSystem();
    const universe = await gqlCall({
      query: `mutation ChangeSystem($id:ID!, $systemId:ID!, $description:String!) {
      pluginUniverseSystemSetDescription(id:$id, systemId:$systemId, description:$description) {
        id
        systems {
          id
          identity {
            description
          }
        }
      }
    }`,
      variables: {id, systemId, description: "Test Description"},
    });
    const system = universe.data?.pluginUniverseSystemSetDescription.systems.find(
      (s: {id: string}) => s.id === systemId
    );
    expect(system.identity.description).toEqual("Test Description");
  });
  it("should set the skybox key of the system", async () => {
    const {id, systemId} = await getSystem();
    const universe = await gqlCall({
      query: `mutation ChangeSystem($id:ID!, $systemId:ID!, $skyboxKey:String!) {
      pluginUniverseSystemSetSkyboxKey(id:$id, systemId:$systemId, skyboxKey:$skyboxKey) {
        id
        systems {
          id
          planetarySystem {
            skyboxKey
          }
        }
      }
    }`,
      variables: {id, systemId, skyboxKey: "Test Key"},
    });
    const system = universe.data?.pluginUniverseSystemSetSkyboxKey.systems.find(
      (s: {id: string}) => s.id === systemId
    );
    expect(system.planetarySystem.skyboxKey).toEqual("Test Key");
  });
  it("should set the position of the system", async () => {
    const {id, systemId} = await getSystem();
    const universe = await gqlCall({
      query: `mutation ChangeSystem($id:ID!, $systemId:ID!, $position:PositionInput!) {
  pluginUniverseSystemSetPosition(id:$id, systemId:$systemId, position:$position) {
      id
      systems {
          id
          position {
            x
            y
            z
          }
          }
        }
      }`,
      variables: {id, systemId, position: {x: 1, y: 2, z: 3}},
    });
    const system = universe.data?.pluginUniverseSystemSetPosition.systems.find(
      (s: {id: string}) => s.id === systemId
    );
    expect(system.position.x).toEqual(1);
    expect(system.position.y).toEqual(2);
    expect(system.position.z).toEqual(3);
  });
});
