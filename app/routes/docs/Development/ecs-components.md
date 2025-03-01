---
title: ECS Components
---

# ECS Components

ECS Components are the building blocks of entities. They define the data
structures can be assigned to entities to make them more than just an ID.

## Defining Components

Components are defined using Zod schemas, with a `z.object` at the root. 

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
import {z} from "zod";

export const identity = z.object({
  static id = "identity" as const;

  /**
   * The name of the entity.
   */
  name: z.string().default("Entity"),

  /**
   * Should only be used for information provided by the Flight Director
   */
  description: z.string().optional()
}).default({})
```
