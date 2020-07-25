import dataStore from "../dataStore";
describe("dataStore", () => {
  it("should load default values", () => {
    const data = dataStore<{test: boolean; hey: number; string: string}>({
      path: "./test",
      initialData: {
        test: true,
        hey: 123,
        string: "Hello!",
      },
    });
    expect(data.hey).toEqual(123);
    expect(data.test).toEqual(true);
    expect(data.string).toEqual("Hello!");
  });
});
