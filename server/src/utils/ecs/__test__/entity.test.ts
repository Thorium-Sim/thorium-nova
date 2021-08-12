import Entity from "../entity";

describe("Entity", () => {
  it("should initialize", () => {
    let entity = new Entity();

    expect(typeof entity.id).toBe("number");
  });

  it("should have an unique id", () => {
    let entity1 = new Entity();
    let entity2 = new Entity();

    expect(entity1.id !== entity2.id).toBeTruthy();
  });

  it("should support getDefault components", () => {
    let entity = new Entity(0, {identity: {name: "bar"}});

    expect(entity.components.identity).toEqual({name: "bar"});
  });

  it("should support default data", () => {
    let entity = new Entity(null, {
      identity: {
        name: "Testing!",
        description: "This is a test.",
      },
    });
    expect(entity.components.identity).toEqual({
      name: "Testing!",
      description: "This is a test.",
    });
  });

  describe("addComponent()", () => {
    it("should add a void object when a name is passed", () => {
      let entity = new Entity();
      entity.addComponent("identity");

      expect(entity.components.identity).toEqual({});
    });
  });

  describe("updateComponent()", () => {
    it("should update an existing component", () => {
      let entity = new Entity();
      entity.addComponent("identity", {name: "bar"});

      expect(entity.components.identity).toEqual({name: "bar"});

      entity.updateComponent("identity", {name: "foo"});

      expect(entity.components.identity).toEqual({name: "foo"});
    });
  });

  describe("updateComponents()", () => {
    it("should update a list of existing component", () => {
      let entity = new Entity();
      entity.addComponent("identity", {name: "bar"});

      expect(entity.components.identity).toEqual({name: "bar"});

      entity.updateComponents({identity: {name: "foo"}});

      expect(entity.components.identity).toEqual({name: "foo"});
    });
  });
});
