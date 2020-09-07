import {gqlCall} from "server/helpers/gqlCall";
import {getPlanetId} from "./utils";

const savedMath = global.Math;

describe("universe planets", () => {
  describe("creating planets", () => {
    beforeEach(() => {
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.5;
      global.Math = mockMath;
    });
    afterEach(() => {
      global.Math = savedMath;
    });
    it("should create planets of every class", async () => {
      const planetTypes = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
      ];
      const universe = await gqlCall({
        query: `mutation CreateUniverse {
        universeCreate(name:"Test Universe") {
          id
        }
      }`,
      });
      const id = universe.data?.universeCreate.id;
      const system = await gqlCall({
        query: `mutation CreateSystem($id:ID!) {
        pluginUniverseAddSystem(id:$id, position:{x:0,y:0,z:0}) {
          id
        }
      }`,
        variables: {id},
      });

      const systemId = system.data?.pluginUniverseAddSystem.id;

      await gqlCall({
        query: `mutation CreateStar($id:ID!, $systemId:ID!) {
        pluginUniverseAddStar(id:$id,systemId:$systemId, spectralType:"G") {
          id
        }
      }`,
        variables: {id, systemId},
      });
      await gqlCall({
        query: `mutation CreateStar($id:ID!, $systemId:ID!) {
        pluginUniverseAddStar(id:$id,systemId:$systemId, spectralType:"G") {
          id
        }
      }`,
        variables: {id, systemId},
      });

      for (let type of planetTypes) {
        const planet = await gqlCall({
          query: `mutation CreatePlanet($id:ID!,$systemId:ID!, $classification:String!) {
            pluginUniverseAddPlanet(id:$id, systemId:$systemId, classification:$classification) {
            id
            isPlanet {
              classification
              age
              radius
              terranMass
              habitable
              lifeforms
            }
            satellite {
              axialTilt
              distance
              orbitalArc
              orbitalInclination
              eccentricity
              showOrbit
            }
            temperature {
              temperature
            }
          }
          }`,
          variables: {
            id,
            systemId,
            classification: type,
          },
        });
        const {id: templateId, ...data} = planet.data?.pluginUniverseAddPlanet;
        expect(data).toMatchSnapshot();
      }
    });
  });
  it("should modify the temperature of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $temperature:Float!) {
      pluginUniversePlanetSetTemperature(id:$id, objectId:$objectId, temperature:$temperature) {
        id 
        temperature {
          temperature
        }
      }
    }`,
      variables: {id, objectId: planetId, temperature: 0},
    });
    expect(
      planet.data?.pluginUniversePlanetSetTemperature.temperature.temperature
    ).toEqual(0);
  });
  it("should modify the age of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $age:Float!) {
      pluginUniversePlanetSetAge(id:$id, objectId:$objectId, age:$age) {
        id 
        isPlanet {
          age
        }
      }
    }`,
      variables: {id, objectId: planetId, age: 1337},
    });
    expect(planet.data?.pluginUniversePlanetSetAge.isPlanet.age).toEqual(1337);
  });
  it("should modify the radius of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $radius:Float!) {
      pluginUniversePlanetSetRadius(id:$id, objectId:$objectId, radius:$radius) {
        id 
        isPlanet {
          radius
        }
      }
    }`,
      variables: {id, objectId: planetId, radius: 1337},
    });
    expect(planet.data?.pluginUniversePlanetSetRadius.isPlanet.radius).toEqual(
      1337
    );
  });
  it("should modify the terran mass of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $terranMass:Float!) {
      pluginUniversePlanetSetTerranMass(id:$id, objectId:$objectId, terranMass:$terranMass) {
        id 
        isPlanet {
          terranMass
        }
      }
    }`,
      variables: {id, objectId: planetId, terranMass: 1337},
    });
    expect(
      planet.data?.pluginUniversePlanetSetTerranMass.isPlanet.terranMass
    ).toEqual(1337);
  });
  it("should modify the lifeforms of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $lifeforms:String!) {
      pluginUniversePlanetSetLifeforms(id:$id, objectId:$objectId, lifeforms:$lifeforms) {
        id 
        isPlanet {
          lifeforms
        }
      }
    }`,
      variables: {id, objectId: planetId, lifeforms: "1337"},
    });
    expect(
      planet.data?.pluginUniversePlanetSetLifeforms.isPlanet.lifeforms
    ).toEqual("1337");
  });
  it("should modify the habitable status of the planet", async () => {
    const {id, planetId} = await getPlanetId();
    const planet = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $habitable:Boolean!) {
      pluginUniversePlanetSetHabitable(id:$id, objectId:$objectId, habitable:$habitable) {
        id 
        isPlanet {
          habitable
        }
      }
    }`,
      variables: {id, objectId: planetId, habitable: false},
    });
    expect(
      planet.data?.pluginUniversePlanetSetHabitable.isPlanet.habitable
    ).toEqual(false);
    const planet2 = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $habitable:Boolean!) {
      pluginUniversePlanetSetHabitable(id:$id, objectId:$objectId, habitable:$habitable) {
        id 
        isPlanet {
          habitable
        }
      }
    }`,
      variables: {id, objectId: planetId, habitable: true},
    });
    expect(
      planet2.data?.pluginUniversePlanetSetHabitable.isPlanet.habitable
    ).toEqual(true);
  });
});
