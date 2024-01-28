---
title: Card & Core Data
---

# Card & Core Creation

Cards and cores are the foundational UI elements for Thorium Nova. Cards are the
screens which the crew uses to control their ship, and cores are how the Flight
Director interacts with the simulation. All cards live inside the
`/@client/cards/` folder, while cores live in `/@client/cores`, with each having
its own PascalCased folder named after the card or core.

Card UIs are largely built with React, but any other web technologies, like SVG,
Canvas, or WebGL, can be used in their creation.

> This document mostly refers to cards, but it applies to both cards and cores.

You likely want to review [`NetRequests`](/docs/development/netRequests) before
reading this document.

## Card Data Subscriptions

The most important part of any card is the data that it displays to the crew.
Subscriptions are intended for low-frequency (less than twice a second) updates
that might have larger data payloads. This is the most commonly used method for
transferring data from the server to the client.

Subscriptions based on a "pubsub" system, where the server publishes data using
`pubsub.publish.path.to.request({...filterArgs})` on a channel that the client
subscribes to. Note that `pubsub.publish` doesn't actually send any data to the
client. It only signals that data for that channel has changed. The client
itself chooses which data it will get when a channel has a publish.

> **IMPORTANT:** Make sure you properly export your router in your card from the
> "/@client/cards/data.ts" file.

### Defining Card Requests

Cards can define the netRequests which will be consumed by the card. There is
even a TypeScript check in place to make sure `pubsub.publish` can't be called
on a netRequest that hasn't been defined in a card yet.

Cards themselves should define their subscriptions in a file called `data.ts`
inside the card's folder.

To define net requests and net sends, the `data.ts` file should export either a
router or a procedure. The properties of this object represent different
netRequest and netSend names. These netRequest names are used by the
`pubsub.publish` function to signal that the data has changed and trigger a
subscription publish. Calling `pubsub.publish` usually happens in a netSend
definition, but it could happen in an infrequently triggered ECS System.

#### Net Request Filters

Net Request filters are optional. The idea is to makes sure that subscriptions
are only fired for the clients that need them. For example, two clients on two
different player ships might have both requested the 'phasers' channel, but when
one of the ships charges their phasers, only the client on that ship should get
the subscription update.

To determine whether a client should receive data, the request's filter function
should check the `input` parameter against data in the database and about the
client, like which ship the client is assigned to. If it determines that the
publish should not go to that client, it should return `false`. This stops the
rest of the data handler from running and indicates that the client shouldn't
receive that update.

Like the example above, it's most commonly used for filtering based on the ship
the client is assigned to, though it could filter based on any other criteria.

```ts
// /@client/cards/Pilot/data.ts
export const pilot = t.router({
  impulseEngines: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number} | null, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        // ...
      }),
  }),
});
```

If the filter function returns `true`, the respective client subscribed to that
channel will receive the publish.

#### Fetching Data

After filtering the subscription, the resolve function collects the data that is
needed for the card to operate. Since it is called both when the card first
loads _and_ when any subscription publishes happen, this function should not
depend on the `publishParams` parameter, though it is made available for special
circumstances.

Whatever the function returns is sent to the client and made available with the
[useNetRequest](#useNetRequest) hook. This most likely means finding specific
entities associated with the ship the client is assigned to.

```ts
// /@client/cards/Pilot/data.ts
export const pilot = t.router({
  impulseEngines: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number} | null, {ctx}) => {
        // ...
      })
      .request(({ctx}) => {
        const {
          impulseEngines: {
            id,
            components: {isImpulseEngines},
          },
        } = getShipSystem(ctx, {
          systemType: "impulseEngines",
        });
        return {
          id: impulseEngines.id,
          targetSpeed: isImpulseEngines?.targetSpeed || 0,
          cruisingSpeed: isImpulseEngines?.cruisingSpeed || 1,
          emergencySpeed: isImpulseEngines?.emergencySpeed || 1,
        };
      }),
  }),
});
```

### Suggestions for Writing Subscriptions

Requests and Sends should be defined as narrowly as possible, and cards should
have as many subscriptions as are necessary to get all of the data. Since we can
nest routers as much as we want, there's little concern about overlapping.

Whenever creating a new request, it's important to make sure that
`pubsub.publish` is being called any time the relevant data changes on the
server. These `pubsub.publish` calls might be happening in sends or systems
elsewhere in the codebase, so keep this in mind and make sure they're always
being called correctly.

The `publish` object passed to `pubsub.publish` should include as many values as
possible to give the filter function as much information as is needed to
determine if the request should go to the client.

## Data Streams

Some data changes very rapidly, like the position and rotation of ships and
moving objects in space, and the position of crew members in space. To keep
latency as low as possible, there's a separate method for sending just this
data.

Cards can define a filter function which is used to select the entities that
will be sent via high-frequency data channels. To keep the bandwidth low, only
the following data sent:

- `id` - The entity id
- `x` - The x position of the entity
- `y` - The y position of the entity
- `z` - The z position of the entity
- `rotation` - The rotation quaternion of the entity

That means the rest of the data needs to be collected with a NetRequest.

Note that not every entity has an x,y,z and rotation property. We can use this
to our advantage, such as sending a stream of impulse and warp speeds to the
client by passing the numbers on the x, y, and z properties as though they were
positions.

The data for each client is sent by the
"/server/src/systems/DataStreamSystem.ts" ECS system, which also defines how
often it is sent. On this interval, the data is processed and encoded in a way
that makes it easy to do
[snapshot interpolation](https://github.com/geckosio/snapshot-interpolation#readme)
on the client.

To define the entity filter for a card, include a `dataStream` function on the
router in the `data.ts` file, which is called for every entity. This function
receives an object with the `entity`, `ctx`, and optionally `input` as
parameters and should return `true` if the entity should be sent to the client.

```ts
export function dataStream(
  entity: Entity,
  context: DataContext,
  params: {systemId: number | null}
): boolean {
  return Boolean(
    entity.components.position?.parentId === systemId &&
      entity.components.velocity
  );
}
```

Data Streams will only be active when `useDataStream` is called somewhere in the
card. This hook accepts parameters and returns nothing, so it's best to call it
at the top of the card component.

```ts
export const cargoControl = t.router({
  stream: t.procedure.dataStream(({entity, ctx}) => {
    if (!entity) return false;
    return Boolean(
      entity.components.cargoContainer &&
        entity.components.position?.parentId === ctx.ship?.id &&
        entity.components.passengerMovement
    );
  }),
});
```

You still need to request the data stream once per card using the `q` utility.
This is where you would pass params, if they were needed.

```ts
q.cargoControl.stream.useDataStream();
```

The challenge with DataStreams is making sure the UI remains responsive while
updating at 60fps. React renders, while really convenient and fast enough for
most purposes, are notoriously bad at 60fps renders.

Because of that, any high-speed animation should be done using transient
updates. This basically means directly manipulating the properties of a DOM
element or Three.js Object3D instead of changing its props. You can read more
about transient updates on the
[Zustand Docs](https://github.com/pmndrs/zustand#transient-updates-for-often-occuring-state-changes)

Because of this, accessing the data from DataStreams is a two-part process:

1. Make sure the requests for your card include the entities that you include in
   your DataStream definition.
2. Render the entities that you want to animate as DOM elements or Three.js
   Object3Ds.
3. In an animation loop, either with `useAnimationFrame` or the `useFrame` hook
   from React Three Fiber, loop over the entities.
4. Access the entity in the DataStream and use the position and rotation data to
   update the properties of the DOM elements or Three.js Object3Ds directly.

Even though DataStream frames are only sent from the server on an interval, we
can still render them at 60fps because of
[snapshot interpolation](https://github.com/geckosio/snapshot-interpolation#readme).

## NetSends

NetSends or Sends are the way clients can trigger mutations to server data.
NetSends are messages sent from the client to the server over WebSockets to
trigger events.

When a client needs to update server data, it sends a message to the server with
the name of the input and any appropriate parameters as a JavaScript object.

Inputs are defined the same way as requests, but don't need a `filter` function
and don't need to return anything, though they can. For more information, review
the [`NetRequests`](/docs/development/netRequests) docs.

When the client sends the message, the server will call the function for that
input, which is able to perform whatever mutations it needs on the databases in
`DataContext`. It should call `pubsub.publish` for any channels it might have
modified.
