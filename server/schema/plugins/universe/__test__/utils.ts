import {gqlCall} from "server/helpers/gqlCall";

export async function getPlanetId() {
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
    universeTemplateAddSystem(id:$id, position:{x:0,y:0,z:0}) {
      id
    }
  }`,
    variables: {id},
  });

  const systemId = system.data?.universeTemplateAddSystem.id;

  const planet = await gqlCall({
    query: `mutation CreatePlanet($id:ID!,$systemId:ID!, $classification:String!) {
      universeTemplateAddPlanet(id:$id, systemId:$systemId, classification:$classification) {
        id
      }
    }`,
    variables: {
      id,
      systemId,
      classification: "M",
    },
  });

  const planetId = planet.data?.universeTemplateAddPlanet.id;
  return {id, planetId};
}
