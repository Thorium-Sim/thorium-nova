---
title: ECS Entities
---

# ECS Entities

Once components have been created, they can be added to entities.

## Creating Entities

Entities are created with two parameters, both optional. The first is either a
unique number ID, a function to generate UIDs, or `null` which uses the default
UID generator.

The second parameter is an object containing the components to add to the
entity, with the key being the component ID (eg "identity") and the values being
the component data.

```ts
const entity = new Entity(null, {
  identity: {
    name: "Bob",
    description: "A nice guy",
  },
});

const entity = new Entity(12345, {
  identity: {
    name: "Alice",
    description: "A nice lady",
  },
});
```

Components can also be assigned to entities with the `addComponent` method,
which adds a single component.

```js
const entity = new Entity();

entity.addComponent("identity", {
  name: "Bob",
  description: "A nice guy",
});
```

Multiple components can be added or updated at the same time with the
`updateComponents` method, which takes an object where the key is the component
id and the value is the component data.

```js
const entity = new Entity();

entity.updateComponents({
  identity: {
    name: "Bob",
    description: "A nice guy",
  },
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
});
```

And, if the need arises, components can be removed from an entity with the
`removeComponent` method. Removing components both deletes the data in the
component and might make certain systems not operate on that entity any more.

```ts
entity.removeComponent("position");
```

### Entity Factories

There are some entities which have a specific purpose, such as planets, stars,
or ships. These entities are always created with the same components, so it
might be helpful to create a factory function to create them.

```ts
// This is not a realistic example, but it shows how to create a factory
function createPlanet({
  name,
  description,
  position,
  radius,
  mass,
  atmosphere,
}: {
  name: string;
  description: string;
  position: {x: number; y: number; z: number};
  radius: number;
  mass: number;
  atmosphere: boolean;
}) {
  return new Entity(null, {
    identity: {
      name,
      description,
    },
    position,
    isPlanet: {
      radius,
      mass,
      atmosphere,
    },
  });
}
```
