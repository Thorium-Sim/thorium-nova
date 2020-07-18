import Entity from "../entity";

describe("Entity", () => {
  it("should initialize", () => {
    let entity = new Entity();

    expect(typeof entity.id).toBe("string");
  });

  it("should have an unique id", () => {
    let entity1 = new Entity();
    let entity2 = new Entity();

    expect(entity1.id !== entity2.id).toBeTruthy();
  });

  it("should support default components", () => {
    let entity = new Entity(0, [
      {
        name: "test",
        defaults: {foo: "bar"},
      },
    ]);

    expect(entity.components.test).toEqual({foo: "bar"});
  });

  describe("addComponent()", () => {
    it("should add a void object when a name is passed", () => {
      let entity = new Entity();
      entity.addComponent("test");

      expect(entity.components.test).toEqual({});
    });
  });

  describe("updateComponent()", () => {
    it("should update an existing component", () => {
      let entity = new Entity();
      entity.addComponent("test", {foo: "bar"});

      expect(entity.components.test).toEqual({foo: "bar"});

      entity.updateComponent("test", {foo: "foo"});

      expect(entity.components.test).toEqual({foo: "foo"});
    });
  });

  describe("updateComponents()", () => {
    it("should update a list of existing component", () => {
      let entity = new Entity();
      entity.addComponent("test", {foo: "bar"});

      expect(entity.components.test).toEqual({foo: "bar"});

      entity.updateComponents({test: {foo: "foo"}});

      expect(entity.components.test).toEqual({foo: "foo"});
    });
  });
});
