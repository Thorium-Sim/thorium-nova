import {gqlCall} from "../../../helpers/gqlCall";
import path from "path";
// @ts-ignore
import {Upload} from "graphql-upload";

const fs = jest.genMockFromModule("fs") as any;

describe("Ship Plugin", () => {
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
    const plugin = await gqlCall({
      query: `mutation CreatePlugin($name:String!) {
      pluginCreate(name:$name) {
        id
        name
      }
    }`,
      variables: {name: "My Outfit Plugin 2"},
    });
    const pluginId = plugin.data?.pluginCreate.id;
    const newOutfit = await gqlCall({
      query: `mutation AddOutfit($pluginId:ID!) {
        pluginAddOutfit(pluginId:$pluginId,  ability:thrusters) {
          id
        }
      }`,
      variables: {pluginId},
    });
    const outfitId = newOutfit.data?.pluginAddOutfit.id;
    const outfits = await gqlCall({
      query: `query Outfits($pluginId:ID!) {
      pluginOutfits(pluginId:$pluginId) {
        id
        identity {
          name
        }
        thrusters {
          thrusting
        }
       
      }
    }`,
      variables: {pluginId},
    });
    expect(outfits.data?.pluginOutfits.length).toEqual(1);
  });
});
