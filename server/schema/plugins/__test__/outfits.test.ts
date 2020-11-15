import {gqlCall} from "../../../helpers/gqlCall";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";
import {
  getOutfitComponents,
  OutfitAbilities,
} from "../outfits/getOutfitComponents";

const fs = jest.genMockFromModule("fs") as any;

let pluginId: string;
let outfitIds: {[ability in OutfitAbilities]?: string} = {};
async function getOutfitId(ability: OutfitAbilities) {
  if (!pluginId) {
    const plugin = await gqlCall({
      query: `mutation CreatePlugin($name:String!) {
        pluginCreate(name:$name) {
          id
          name
        }
      }`,
      variables: {name: "My Outfit Plugin"},
    });
    pluginId = plugin.data?.pluginCreate.id;
  }
  if (!outfitIds[ability]) {
    const newOutfit = await gqlCall({
      query: `mutation AddOutfit($pluginId:ID!, $ability: OutfitAbilities!) {
        pluginAddOutfit(pluginId:$pluginId,  ability:$ability) {
          id
        }
      }`,
      variables: {pluginId, ability},
    });
    outfitIds[ability] = newOutfit.data?.pluginAddOutfit.id;
  }
  return {pluginId, outfitId: outfitIds[ability]};
}
describe("outfit Plugin", () => {
  it("should query and get no results", async () => {
    const plugin = await gqlCall({
      query: `mutation CreatePlugin($name:String!) {
      pluginCreate(name:$name) {
        id
        name
      }
    }`,
      variables: {name: "My Outfit Plugin 1"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const outfits = await gqlCall({
      query: `query Outfits($pluginId:ID!) {
      pluginOutfits(pluginId:$pluginId) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {pluginId},
    });
    expect(outfits.data?.pluginOutfits).toEqual([]);
  });
  it("should create a new outfit", async () => {
    const {pluginId} = await getOutfitId(OutfitAbilities.generic);
    const outfits = await gqlCall({
      query: `query Outfits($pluginId:ID!) {
      pluginOutfits(pluginId:$pluginId) {
        id
        identity {
          name
        }
      }
    }`,
      variables: {pluginId},
    });
    expect(outfits.data?.pluginOutfits.length).toEqual(1);
  });
  it("should set basic properties on the outfit", async () => {
    const {pluginId, outfitId} = await getOutfitId(OutfitAbilities.generic);
    const setName = await gqlCall({
      query: `mutation SetName($pluginId:ID!, $outfitId:ID!, $name:String!) {
        pluginOutfitSetName(pluginId:$pluginId, outfitId:$outfitId, name:$name) {
          id
          identity {
            name
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        name: "My New Name",
      },
    });
    expect(setName.data?.pluginOutfitSetName.identity.name).toEqual(
      "My New Name"
    );
    const setDescription = await gqlCall({
      query: `mutation SetName($pluginId:ID!, $outfitId:ID!, $description:String!) {
        pluginOutfitSetDescription(pluginId:$pluginId, outfitId:$outfitId, description:$description) {
          id
          identity {
            description
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        description: "My New Description",
      },
    });
    expect(
      setDescription.data?.pluginOutfitSetDescription.identity.description
    ).toEqual("My New Description");
    const setTags = await gqlCall({
      query: `mutation SetTags($pluginId:ID!, $outfitId:ID!, $tags:[String!]!) {
        pluginOutfitSetTags(pluginId:$pluginId, outfitId:$outfitId, tags:$tags) {
          id
          tags {
            tags
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        tags: ["Tag 1"],
      },
    });
    expect(setTags.data?.pluginOutfitSetTags.tags.tags).toEqual(["Tag 1"]);
  });
  it("should set impulse engine properties on the outfit", async () => {
    const {pluginId, outfitId} = await getOutfitId(
      OutfitAbilities.impulseEngines
    );
    const outfit = await gqlCall({
      query: `query GetOutfit($pluginId:ID!, $outfitId:ID!) {
        impulseEnginesOutfit(pluginId:$pluginId, outfitId:$outfitId) {
          id
          impulseEngines{
            cruisingSpeed
            emergencySpeed
            thrust
            targetSpeed
          }
        }
      }`,
      variables: {pluginId, outfitId},
    });

    expect(outfit.data?.impulseEnginesOutfit.impulseEngines)
      .toMatchInlineSnapshot(`
      Object {
        "cruisingSpeed": 1500,
        "emergencySpeed": 2000,
        "targetSpeed": 0,
        "thrust": 1,
      }
    `);
    const update = await gqlCall({
      query: `mutation Update($pluginId:ID!, $outfitId:ID!, $speed:Float!, $thrust:Float!) {
        impulseEnginesSetCruisingSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        impulseEnginesSetEmergencySpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        impulseEnginesSetThrust(pluginId:$pluginId, outfitId:$outfitId, thrust:$thrust) {
          id
        }
        impulseEnginesSetTargetSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
          impulseEngines{
            cruisingSpeed
            emergencySpeed
            thrust
            targetSpeed
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        speed: 500,
        thrust: 2.5,
      },
    });

    const engines = update.data?.impulseEnginesSetTargetSpeed.impulseEngines;
    expect(engines.cruisingSpeed).toEqual(500);
    expect(engines.emergencySpeed).toEqual(500);
    expect(engines.thrust).toEqual(2.5);
    expect(engines.targetSpeed).toEqual(500);
  });
  it("should set navigation properties on the outfit", async () => {
    const {pluginId, outfitId} = await getOutfitId(OutfitAbilities.navigation);
    const outfit = await gqlCall({
      query: `query GetOutfit($pluginId:ID!, $outfitId:ID!) {
        navigationOutfit(pluginId:$pluginId, outfitId:$outfitId) {
          id
          navigation{
            locked
            maxDestinationRadius
          }
        }
      }`,
      variables: {pluginId, outfitId},
    });
    expect(outfit.data?.navigationOutfit.navigation).toMatchInlineSnapshot(`
      Object {
        "locked": false,
        "maxDestinationRadius": 0,
      }
    `);
    const update = await gqlCall({
      query: `mutation Update($pluginId:ID!, $outfitId:ID!, $locked:Boolean!, $radius:Float!) {
        navigationSetLocked(pluginId:$pluginId, outfitId:$outfitId, locked:$locked) {
          id
        }
        navigationSetMaxDestinationRadius(pluginId:$pluginId, outfitId:$outfitId, maxDestinationRadius:$radius) {
          id
          navigation{
            locked
            maxDestinationRadius
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        locked: true,
        radius: 1000,
      },
    });

    const navigation =
      update.data?.navigationSetMaxDestinationRadius.navigation;
    expect(navigation.locked).toEqual(true);
    expect(navigation.maxDestinationRadius).toEqual(1000);
  });
  it("should set thrusters properties on the outfit", async () => {
    const {pluginId, outfitId} = await getOutfitId(OutfitAbilities.thrusters);
    const outfit = await gqlCall({
      query: `query GetOutfit($pluginId:ID!, $outfitId:ID!) {
        thrustersOutfit(pluginId:$pluginId, outfitId:$outfitId) {
          id
          thrusters{
            thrusting
            direction {
              x,
              y,
              z
            }
            
            directionMaxSpeed
            directionThrust
            rotationDelta {
              x,
              y,
              z
            }
            
            rotationMaxSpeed
            rotationThrust
          }
        }
      }`,
      variables: {pluginId, outfitId},
    });

    expect(outfit.data?.thrustersOutfit.thrusters).toMatchInlineSnapshot(`
      Object {
        "direction": Object {
          "x": 0,
          "y": 0,
          "z": 0,
        },
        "directionMaxSpeed": 1,
        "directionThrust": 12500,
        "rotationDelta": Object {
          "x": 0,
          "y": 0,
          "z": 0,
        },
        "rotationMaxSpeed": 5,
        "rotationThrust": 200,
        "thrusting": false,
      }
    `);
    const update = await gqlCall({
      query: `mutation Update($pluginId:ID!, $outfitId:ID!, $direction:CoordinatesInput!, $speed:Float!, $thrust:Float!) {
        thrustersSetDirection(pluginId:$pluginId, outfitId:$outfitId, direction:$direction) {
          id
        }
        thrustersSetDirectionMaxSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        thrustersSetDirectionThrust(pluginId:$pluginId, outfitId:$outfitId, thrust:$thrust) {
          id
        }
        thrustersSetRotationDelta(pluginId:$pluginId, outfitId:$outfitId, rotation:$direction) {
          id
        }
        thrustersSetRotationMaxSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        thrustersSetRotationThrust(pluginId:$pluginId, outfitId:$outfitId, thrust:$thrust) {
          id
          thrusters{
            thrusting
            direction {
              x
              y
              z
            }
            directionMaxSpeed
            directionThrust
            rotationDelta {
              x
              y
              z
            }
            rotationMaxSpeed
            rotationThrust
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        direction: {
          x: 1,
          y: 2,
          z: 3,
        },
        speed: 10,
        thrust: 2.5,
      },
    });
    const thrusters = update.data?.thrustersSetRotationThrust.thrusters;
    expect(thrusters).toMatchInlineSnapshot(`
      Object {
        "direction": Object {
          "x": 1,
          "y": 2,
          "z": 3,
        },
        "directionMaxSpeed": 10,
        "directionThrust": 2.5,
        "rotationDelta": Object {
          "x": 1,
          "y": 2,
          "z": 3,
        },
        "rotationMaxSpeed": 10,
        "rotationThrust": 2.5,
        "thrusting": true,
      }
    `);
  });
  it("should set warp engines properties on the outfit", async () => {
    const {pluginId, outfitId} = await getOutfitId(OutfitAbilities.warpEngines);
    const outfit = await gqlCall({
      query: `query GetOutfit($pluginId:ID!, $outfitId:ID!) {
        warpEnginesOutfit(pluginId:$pluginId, outfitId:$outfitId) {
          id
          warpEngines {
            interstellarCruisingSpeed
            planetaryCruisingSpeed
            minSpeedMultiplier
            warpFactorCount
            currentWarpFactor
            forwardAcceleration
          }
        }
      }`,
      variables: {pluginId, outfitId},
    });
    expect(outfit.data?.warpEnginesOutfit.warpEngines).toMatchInlineSnapshot(`
      Object {
        "currentWarpFactor": 0,
        "forwardAcceleration": 0,
        "interstellarCruisingSpeed": 599600000000,
        "minSpeedMultiplier": 0.01,
        "planetaryCruisingSpeed": 29980000,
        "warpFactorCount": 5,
      }
    `);
    const update = await gqlCall({
      query: `mutation Update($pluginId:ID!, $outfitId:ID!, $speed:Float!, $multiplier:Float!, $count:Int!, $factor:Int!) {
        warpEngineSetInterstellarCruisingSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        warpEngineSetPlanetaryCruisingSpeed(pluginId:$pluginId, outfitId:$outfitId, speed:$speed) {
          id
        }
        warpEngineSetMinSpeedMultiplier(pluginId:$pluginId, outfitId:$outfitId, multiplier:$multiplier) {
          id
        }
        warpEngineSetWarpFactorCount(pluginId:$pluginId, outfitId:$outfitId, count:$count) {
          id
        }
        warpEngineSetCurrentWarpFactor(pluginId:$pluginId, outfitId:$outfitId, factor:$factor) {
          id
          warpEngines {
            interstellarCruisingSpeed
            planetaryCruisingSpeed
            minSpeedMultiplier
            warpFactorCount
            currentWarpFactor
            forwardAcceleration
          }
        }
      }`,
      variables: {
        pluginId,
        outfitId,
        speed: 100000,
        multiplier: 0.1,
        count: 7,
        factor: 3,
      },
    });
    const engines = update.data?.warpEngineSetCurrentWarpFactor.warpEngines;
    expect(engines).toMatchInlineSnapshot(`
      Object {
        "currentWarpFactor": 3,
        "forwardAcceleration": 0,
        "interstellarCruisingSpeed": 100000,
        "minSpeedMultiplier": 0.1,
        "planetaryCruisingSpeed": 100000,
        "warpFactorCount": 7,
      }
    `);
  });
  describe("getOutfitComponents", () => {
    it("should return the correct components for each outfit", () => {
      Object.values(OutfitAbilities).forEach(o => {
        expect(getOutfitComponents(o)).toMatchSnapshot();
      });
    });
  });
});
