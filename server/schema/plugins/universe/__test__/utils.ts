import {gqlCall} from "server/helpers/gqlCall";

export async function getPlanetId() {
  const universe = await gqlCall({
    query: `mutation CreateUniverse {
    pluginCreate(name:"Test Universe${Math.random()}") {
      id
    }
  }`,
  });
  const id = universe.data?.pluginCreate.id;
  const system = await gqlCall({
    query: `mutation CreateSystem($id:ID!) {
    pluginUniverseAddSystem(id:$id, position:{x:0,y:0,z:0}) {
      id
    }
  }`,
    variables: {id},
  });

  const systemId = system.data?.pluginUniverseAddSystem.id;

  const planet = await gqlCall({
    query: `mutation CreatePlanet($id:ID!,$systemId:ID!, $classification:String!) {
      pluginUniverseAddPlanet(id:$id, systemId:$systemId, classification:$classification) {
        id
      }
    }`,
    variables: {
      id,
      systemId,
      classification: "M",
    },
  });

  const planetId = planet.data?.pluginUniverseAddPlanet.id;
  return {id, planetId};
}
