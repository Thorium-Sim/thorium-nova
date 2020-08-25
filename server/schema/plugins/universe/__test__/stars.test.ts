import {gqlCall} from "server/helpers/gqlCall";
const savedMath = global.Math;

async function getStarId() {
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

  const star = await gqlCall({
    query: `mutation CreateStar($id:ID!,$systemId:ID!, $spectralType:String!) {
      universeTemplateAddStar(id:$id, systemId:$systemId, spectralType:$spectralType) {
        id
      }
    }`,
    variables: {
      id,
      systemId,
      spectralType: "M",
    },
  });

  const starId = star.data?.universeTemplateAddStar.id;
  return {id, starId};
}

describe("universe stars", () => {
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
      const starTypes = ["O", "B", "G", "K", "MG", "M", "D"];
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
        universeTemplateAddSystem(id:$id, position:{x:0,y:0,z:0}) {
          id
        }
      }`,
        variables: {id},
      });

      const systemId = system.data?.universeTemplateAddSystem.id;

      for (let type of starTypes) {
        const star = await gqlCall({
          query: `mutation CreateStar($id:ID!, $systemId:ID!, $spectralType:String!) {
          universeTemplateAddStar(id:$id,systemId:$systemId, spectralType:$spectralType) {
            id
            isStar {
              solarMass
              age
              spectralType
              hue
              isWhite
              radius
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
          variables: {id, systemId, spectralType: type},
        });

        const {id: templateId, ...data} = star.data?.universeTemplateAddStar;
        expect(data).toMatchSnapshot();
        await gqlCall({
          query: `mutation RemoveStar($id:ID!, $objectId:ID!) {
            universeTemplateRemoveObject(id:$id, objectId:$objectId)
          }`,
          variables: {id, objectId: templateId},
        });
      }
    });
  });
  it("should set the solar mass", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $solarMass:Float!) {
        universeTemplateStarSetSolarMass(id:$id, objectId:$objectId, solarMass:$solarMass) {
          id 
          isStar {
            solarMass
          }
        }
      }`,
      variables: {id, objectId: starId, solarMass: 1337},
    });
    expect(
      star.data?.universeTemplateStarSetSolarMass.isStar.solarMass
    ).toEqual(1337);
  });
  it("should set the age", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $age:Float!) {
        universeTemplateStarSetAge(id:$id, objectId:$objectId, age:$age) {
          id 
          isStar {
            age
          }
        }
      }`,
      variables: {id, objectId: starId, age: 1337},
    });
    expect(star.data?.universeTemplateStarSetAge.isStar.age).toEqual(1337);
  });
  it("should set the hue", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $hue:Float!) {
        universeTemplateStarSetHue(id:$id, objectId:$objectId, hue:$hue) {
          id 
          isStar {
            hue
          }
        }
      }`,
      variables: {id, objectId: starId, hue: 1337},
    });
    expect(star.data?.universeTemplateStarSetHue.isStar.hue).toEqual(1337);
  });

  it("should set the radius", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $radius:Float!) {
        universeTemplateStarSetRadius(id:$id, objectId:$objectId, radius:$radius) {
          id 
          isStar {
            radius
          }
        }
      }`,
      variables: {id, objectId: starId, radius: 1337},
    });
    expect(star.data?.universeTemplateStarSetRadius.isStar.radius).toEqual(
      1337
    );
  });
  it("should set the is white", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $isWhite:Boolean!) {
        universeTemplateStarSetIsWhite(id:$id, objectId:$objectId, isWhite:$isWhite) {
          id 
          isStar {
            isWhite
          }
        }
      }`,
      variables: {id, objectId: starId, isWhite: false},
    });
    expect(star.data?.universeTemplateStarSetIsWhite.isStar.isWhite).toEqual(
      false
    );
    const star2 = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $isWhite:Boolean!) {
        universeTemplateStarSetIsWhite(id:$id, objectId:$objectId, isWhite:$isWhite) {
          id 
          isStar {
            isWhite
          }
        }
      }`,
      variables: {id, objectId: starId, isWhite: true},
    });
    expect(star2.data?.universeTemplateStarSetIsWhite.isStar.isWhite).toEqual(
      true
    );
  });
  it("should set the temperature", async () => {
    const {id, starId} = await getStarId();
    const star = await gqlCall({
      query: `mutation ChangeStar($id:ID!, $objectId:ID!, $temperature:Float!) {
        universeTemplateStarSetTemperature(id:$id, objectId:$objectId, temperature:$temperature) {
          id 
          temperature {
            temperature
          }
        }
      }`,
      variables: {id, objectId: starId, temperature: 1337},
    });
    expect(
      star.data?.universeTemplateStarSetTemperature.temperature.temperature
    ).toEqual(1337);
  });
});
