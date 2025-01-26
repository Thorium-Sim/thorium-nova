---
title: Ship Systems
order: 5
---

# Ship Systems

Ship Systems are entities which are associated with a ship and provide capabilities to the ship. They are configured within plugins. There's a good bit of boilerplate that is required for making new systems. This guide covers what needs to be added.

> It's worth noting that the ship system `type` is used all over the place in this process - in file names, component names, etc.

## Ship System Class

The definition for ship system plugin data is stored in  the `/server/src/classes/Plugins/ShipSystems` folder. Duplicate the `Generic.ts` ship system class and edit it as necessary for your ship system.

- Be sure to rename it something unique, both the class, the classes `type` instance property, and where `registerSystem` is called below.
- Adjust the flags that apply to your ship system.
- Add the properties which can be configured by crew to the instance definition and the constructor. Be sure to first use the params in the constructor, followed by a default value.

You'll notice that TypeScript is giving you warnings about your type. Each ship system needs to be included in the list of possible ship systems. This is done by adding the class plugin to the lists in `/server/src/classes/Plugins/ShipSystems/shipSystemTypes.ts` and `/server/src/components/shipSystems/isShipSystem.ts`.

## Ship System Config UI

If your ship system can be configured, eg. if your ship system class has properties, you need to create the UI for configuring that ship system in `/client/app/routes/config+/$pluginId.system+/SystemConfigs`. The README in that folder includes some basic instructions. You can use one of the other components as a template.

You will also need to create an API router for getting and updating the data for your system. Those are stored in `/client/app/data/plugins/systems/{systemType}.ts`. Typically these include a `get` request for getting the specific system properties, and an `update` send for updating those properties. 

The `update` function should call `getShipSystemForInput`, which makes it possible for a ship to override specific properties of a ship system that is assigned to that ship. Like above, it's probably best to duplicate an existing API router and modify it for your ship system.

## Ship System Component

Ship systems have a corresponding component which stores all of the properties of the ship system during a flight. These are stored in the `/server/components/shipSystems` folder, with a `is` prefix, as in `isWarpEngines.ts`. Don't forget to add it to the index file. Also note that components are used client-side and server-side, so they cannot import server-only modules.

_The component can have more properties than the ship system class_. In fact, there might be situations where the class and component have no properties in common. It's possible the class defines some config which is used to generate properties on the component when it is spawned. This logic would reside somewhere in the `/server/src/spawners/ship.ts` file as an extra case handled when the ship systems are being spawned.

## ECS Systems

Create any ECS systems to manage and control your ship system. How many and what kind you create depend on the ship system, so details aren't included in this guide.

---

Now you can access and use your ship system in card API routes.