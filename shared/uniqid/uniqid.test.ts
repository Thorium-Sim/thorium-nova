import uniqid from "./index";

describe("uniqid", () => {
  it("should return a string", () => {
    expect(typeof uniqid()).toBe("string");
  });
  it("should return a different string each time", () => {
    const id = uniqid();
    const id2 = uniqid();
    expect(id).not.toBe(id2);
  });
});
