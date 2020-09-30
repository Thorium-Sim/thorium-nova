import {gqlCall} from "server/helpers/gqlCall";
import {getPlanetId} from "./utils";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";

const fs = jest.genMockFromModule("fs") as any;
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
        pluginCreate(name:"Test Universe") {
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
    it("should create a moon for a planet", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation CreateMoon($id:ID!,$objectId:ID!, $classification:String!) {
          pluginUniverseAddMoon(id:$id, objectId:$objectId, classification:$classification) {
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
          objectId: planetId,
          classification: "M",
        },
      });
      const {id: templateId, ...data} = planet.data?.pluginUniverseAddMoon;
      expect(data).toMatchSnapshot();
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
  it("should add a texture to a planet", async () => {
    const {id, planetId} = await getPlanetId();
    const file = fs.createReadStream(path.resolve(__dirname, `./upload.png`));
    const upload = new Upload();
    const planet = gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $image:Upload!) {
        pluginUniversePlanetSetTexture(id:$id, objectId:$objectId, image:$image) {
        id 
        isPlanet {
          textureMapAsset
          cloudsMapAsset
          ringsMapAsset
        }
      }
    }`,
      variables: {id, objectId: planetId, image: upload},
    });

    upload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "upload.png",
      mimetype: `image/png`,
    });
    expect(
      (
        await planet
      ).data?.pluginUniversePlanetSetTexture.isPlanet.textureMapAsset.includes(
        "assets/planet-texture-"
      )
    ).toBeTruthy();
  });
  it("should add and remove clouds from a planet", async () => {
    const {id, planetId} = await getPlanetId();
    const file = fs.createReadStream(path.resolve(__dirname, `./upload.png`));
    const upload = new Upload();
    const planet = gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $image:Upload!) {
        pluginUniversePlanetSetClouds(id:$id, objectId:$objectId, image:$image) {
        id 
        isPlanet {
          textureMapAsset
          cloudsMapAsset
          ringsMapAsset
        }
      }
    }`,
      variables: {id, objectId: planetId, image: upload},
    });

    upload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "upload.png",
      mimetype: `image/png`,
    });
    expect(
      (
        await planet
      ).data?.pluginUniversePlanetSetClouds.isPlanet.cloudsMapAsset.includes(
        "assets/planet-clouds-"
      )
    ).toBeTruthy();
    const clearedAsset = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!) {
        pluginUniversePlanetClearClouds(id:$id, objectId:$objectId) {
        id 
        isPlanet {
          textureMapAsset
          cloudsMapAsset
          ringsMapAsset
        }
      }
    }`,
      variables: {id, objectId: planetId, image: upload},
    });
    expect(
      clearedAsset.data?.pluginUniversePlanetClearClouds.isPlanet.cloudsMapAsset
    ).toEqual("");
  });
  it("should add and remove rings from a planet", async () => {
    const {id, planetId} = await getPlanetId();
    const file = fs.createReadStream(path.resolve(__dirname, `./upload.png`));
    const upload = new Upload();
    const planet = gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $image:Upload!) {
        pluginUniversePlanetSetRings(id:$id, objectId:$objectId, image:$image) {
        id 
        isPlanet {
          textureMapAsset
          cloudsMapAsset
          ringsMapAsset
        }
      }
    }`,
      variables: {id, objectId: planetId, image: upload},
    });

    upload.resolve({
      createReadStream: () => file,
      stream: file,
      filename: "upload.png",
      mimetype: `image/png`,
    });
    expect(
      (
        await planet
      ).data?.pluginUniversePlanetSetRings.isPlanet.ringsMapAsset.includes(
        "assets/planet-rings-"
      )
    ).toBeTruthy();
    const clearedAsset = await gqlCall({
      query: `mutation ChangePlanet($id:ID!, $objectId:ID!) {
        pluginUniversePlanetClearRings(id:$id, objectId:$objectId) {
        id 
        isPlanet {
          textureMapAsset
          cloudsMapAsset
          ringsMapAsset
        }
      }
    }`,
      variables: {id, objectId: planetId, image: upload},
    });
    expect(
      clearedAsset.data?.pluginUniversePlanetClearRings.isPlanet.ringsMapAsset
    ).toEqual("");
  });
});
