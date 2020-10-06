import {getOutfit} from "./utils";

describe("utils", () => {
  describe("getOutfit", () => {
    it("should throw an error with invalid input", () => {
      try {
        getOutfit({});
      } catch (err) {
        expect(err.message).toEqual(
          "Cannot query for outfit. Both 'shipId' and 'outfitType' or both 'outfitId' and 'pluginId' are required."
        );
      }
      try {
        getOutfit({shipId: "Test"});
      } catch (err) {
        expect(err.message).toEqual(
          "Cannot query for outfit. Both 'shipId' and 'outfitType' or both 'outfitId' and 'pluginId' are required."
        );
      }
      try {
        getOutfit({outfitType: "warpEngines"});
      } catch (err) {
        expect(err.message).toEqual(
          "Cannot query for outfit. Both 'shipId' and 'outfitType' or both 'outfitId' and 'pluginId' are required."
        );
      }
      try {
        getOutfit({shipId: "Test", outfitType: "warpEngines"});
      } catch (err) {
        expect(err.message).toEqual("Cannot find outfit.");
      }
      try {
        getOutfit({pluginId: "Test"});
      } catch (err) {
        expect(err.message).toEqual(
          "Cannot query for outfit. 'outfitId' is required."
        );
      }
      try {
        getOutfit({outfitId: "Test"});
      } catch (err) {
        expect(err.message).toEqual(
          "Cannot query for outfit. 'pluginId' is required."
        );
      }
    });
  });
});
