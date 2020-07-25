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
    let entity = new Entity("0", [
      {
        id: "identity",
        defaults: {foo: "bar"},
      },
    ]);

    expect(entity.components.identity).toEqual({foo: "bar"});
  });
  it("should support getDefault components", () => {
    let entity = new Entity("0", [
      {
        id: "identity",
        getDefaults: () => ({foo: "bar"}),
      },
    ]);

    expect(entity.components.identity).toEqual({foo: "bar"});
  });

  it("should support default data", () => {
    let entity = new Entity({
      id: "test",
      components: {
        identity: {name: "Testing!"},
      },
      systems: [],
    });

    expect(entity.components.identity).toEqual({name: "Testing!"});
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
      entity.addComponent("identity", {foo: "bar"});

      expect(entity.components.identity).toEqual({foo: "bar"});

      entity.updateComponent("identity", {foo: "foo"});

      expect(entity.components.identity).toEqual({foo: "foo"});
    });
  });

  describe("updateComponents()", () => {
    it("should update a list of existing component", () => {
      let entity = new Entity();
      entity.addComponent("identity", {foo: "bar"});

      expect(entity.components.identity).toEqual({foo: "bar"});

      entity.updateComponents({identity: {foo: "foo"}});

      expect(entity.components.identity).toEqual({foo: "foo"});
    });
  });
});
