import {ECS, Entity} from "./ecs";
import {entityQuery} from "./entityQuery";

const server: any = {};

describe("entity query", () => {
  it("should find an entity by id", () => {
    const ecs = new ECS(server);
    const entity = new Entity();
    ecs.addEntity(entity);

    expect(entityQuery(ecs, {filter: {id: entity.id}})).toEqual([entity]);
  });
  it("should find an entity by identity", () => {
    const ecs = new ECS(server);
    const entity = new Entity();
    entity.addComponent("identity", {
      name: "Test",
    });
    ecs.addEntity(entity);

    const entity2 = new Entity();
    entity2.addComponent("identity", {
      name: "Test2",
    });
    ecs.addEntity(entity2);

    expect(
      entityQuery(ecs, {filter: {identity: {name: {eq: "Test"}}}})
    ).toEqual([entity]);
    expect(
      entityQuery(ecs, {filter: {identity: {name: {starts_with: "Test"}}}})
    ).toEqual([entity, entity2]);
    expect(
      entityQuery(ecs, {filter: {identity: {name: {ends_with: "2"}}}})
    ).toEqual([entity2]);
  });
  it("should find an entity by position", () => {
    const ecs = new ECS(server);
    const entity = new Entity();
    entity.addComponent("position", {
      x: 0,
      y: 0,
    });
    ecs.addEntity(entity);

    const entity2 = new Entity();
    entity2.addComponent("position", {
      x: 0,
      y: 1,
    });
    ecs.addEntity(entity2);

    expect(entityQuery(ecs, {filter: {position: {x: {eq: 0}}}})).toEqual([
      entity,
      entity2,
    ]);
    expect(
      entityQuery(ecs, {filter: {position: {x: {eq: 0}, y: {eq: 1}}}})
    ).toEqual([entity2]);
  });
  it("should transform an entity to pull out a single value", () => {
    const ecs = new ECS(server);
    const entity = new Entity();
    entity.addComponent("position", {
      x: 0,
      y: 0,
    });
    entity.addComponent("identity", {
      name: "Test",
    });
    ecs.addEntity(entity);

    const entity2 = new Entity();
    entity2.addComponent("position", {
      x: 0,
      y: 1,
    });
    entity2.addComponent("identity", {
      name: "Test2",
    });
    ecs.addEntity(entity2);

    expect(
      entityQuery(ecs, {
        filter: {position: {x: {eq: 0}}},
        select: {position: {x: true, y: true}},
      })
    ).toEqual([0, 0]);

    expect(
      entityQuery(ecs, {
        filter: {position: {x: {eq: 0}}},
        select: {position: {x: true}, identity: {name: true}},
      })
    ).toEqual([0, 0]);

    expect(
      entityQuery(ecs, {
        filter: {position: {x: {eq: 0}}},
        select: {identity: {name: true}},
      })
    ).toEqual(["Test", "Test2"]);
  });
  it("should compare one entity's value to another's", () => {
    const ecs = new ECS(server);
    const entity = new Entity();
    entity.addComponent("position", {
      x: 1,
      y: 0,
    });
    entity.addComponent("identity", {
      name: "Test",
    });
    ecs.addEntity(entity);

    const entity2 = new Entity();
    entity2.addComponent("position", {
      x: 0,
      y: 1,
    });
    entity2.addComponent("identity", {
      name: "Test2",
    });
    ecs.addEntity(entity2);

    expect(
      entityQuery(ecs, {
        filter: {
          position: {
            y: {
              eq: {
                filter: {identity: {name: {eq: "Test"}}},
                select: {position: {x: true}},
              },
            },
          },
        },
        select: {identity: {name: true}},
      })
    ).toEqual(["Test2"]);
  });
});
