---
title: ECS Components
---

# ECS Components

ECS Components are the building blocks of entities. They define the data
structures can be assigned to entities to make them more than just an ID.

## Defining Components

Components should extend from the `Component` class defined in
"/server/src/components/utils.ts" and be placed inside the
`/server/src/components` folder or a sub-folder. Every component should include
a static `id` which is a literal string type. Using `as const` here is helpful.

Components should contain as many properties for that component that are
exclusive to that component. Properties should be defined with a type and either
include a default value or be listed as optional. This helps with type safety
and auto-complete.

If a property might be useful to have on many kinds of entities, it should be
split out into its own component. Good judgement should be applied here. It
makes sense to have a separate `heat` component so engine entities, reactor
entities, and phaser entities can all use the single component. However, using
that same `heat` component for a star might not make as much sense, since we
likely won't simulate variations in star heat.

Here's an example of the identity component, which includes two properties.
Notice the JSDoc comments which can be useful for knowing more context about the
property. For example, a comment can be added explaining the temperature scale
used for heat.

```ts
// /server/src/components/identity.ts
import {Component} from "./utils";

export class IdentityComponent extends Component {
  static id = "identity" as const;

  /**
   * The name of the entity.
   */
  name: string = "Entity";

  /**
   * Should only be used for information provided by the Flight Director
   */
  description?: string = "";
}
```

There are two kinds of components: regular components with properties, as we saw
above, and flag component, which have no properties and only exist to identify
groups of entities.

## Flag Components

Flags are often used by Systems to know whether an entity should be included in
that system's update function. They can also be used by subscriptions and
DataStream filters to find entities that should be sent to the client. An
important example of a flag component is `isPlayerShip`, which identifies ships
that are being controlled by a human player.

```ts
import {Component, ComponentOmit} from "./utils";

export class IsPlayerShipComponent extends Component {
  static id: "isPlayerShip" = "isPlayerShip";

  value: true = true;
}
```

## Component Catalog

This is a catalog of all of the components, along with what their properties and
purpose is.

### Identity

**Purpose:** Provides a name and description for an entity.

**Properties:**

- name (_string_): The name of the entity.
- description (_string_): A description of the entity.

### IsPlayerShip

**Purpose:** Flag component. Identifies entities that are controlled by a human
player.

### IsShip

**Purpose:** Identifies entities that are ships.

**Properties:**

- mass (_number_): The mass of the ship in kilograms.

- shipClass (_string_): The class of the ship.

- registry (_string_): The registry number of the ship.

### Position

**Purpose:** Provides the position of an entity in 3D space.

**Properties:**

- x (_number_): The x coordinate of the entity.
- y (_number_): The y coordinate of the entity.
- z (_number_): The z coordinate of the entity.

### Velocity

**Purpose:** Provides the velocity of an entity in 3D space.

**Properties:**

- x (_number_): The x unit velocity of the entity.
- y (_number_): The y unit velocity of the entity.
- z (_number_): The z unit velocity of the entity.

### Rotation

**Purpose:** Provides the rotation of an entity in 3D space using a quaternion.

**Properties:**

- x (_number_): The x component of the quaternion.
- y (_number_): The y component of the quaternion.
- z (_number_): The z component of the quaternion.
- w (_number_): The w component of the quaternion.

### Color

**Purpose:** Provides the color of an entity. Should be CSS-compatible.

**Properties:**

- color (_string_): The color of the entity.

### Timer

**Purpose:** Provides the necessary properties for an entity to be used as a
countdown timer.

**Properties:**

- time (_string_): The time in HH:MM:SS format that the timer has remaining.
- paused (_boolean_): Whether the timer is paused or not.
- label (_string_): The label of the timer.
