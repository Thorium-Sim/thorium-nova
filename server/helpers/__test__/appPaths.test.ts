import {appStoreDir, appStorePath} from "../appPaths";

describe("appPaths", () => {
  it("should have the correct values", () => {
    expect(appStorePath).toEqual("./data/snapshot-test.json");
    expect(appStoreDir).toEqual("./data/");
  });
});
