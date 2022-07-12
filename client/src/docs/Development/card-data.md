---
title: Card & Core Data
---

# Card & Core Creation

Cards and cores are the foundational UI elements for Thorium Nova. Cards are the
screens which the crew uses to control their ship, and cores are how the Flight
Director interacts with the simulation. All cards live inside the
`/client/src/cards/` folder, while cores live in `/client/src/cores`, with each
having its own PascalCased folder named after the card or core.

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
`pubsub.publish(channelName, {...filterArgs})` on a channel that the client
subscribes to. Note that `pubsub.publish` doesn't actually send any data to the
client. It only signals that data for that channel has changed. The client
itself chooses which data it will get when a channel has a publish.

For more information and a reference about pubsub channels, see the
[Pubsub channel reference](pubsub-channel-reference) document.

> **IMPORTANT:** Make sure you properly export your data functions in your card
> from the "/client/src/cards/dataList.ts" file.

### Defining Card Requests

Cards can define the netRequests which will be consumed by the card. There is
even a TypeScript check in place to make sure `pubsub.publish` can't be called
on a netRequest that hasn't been defined in a card yet. These netRequests are
exactly the same as the netRequests defined in the `server/src/netRequests`
folder - it's just nice to colocate them with the card they'll be used in.

Cards themselves define their subscriptions in a file called `data.ts` inside
the card's folder.

To define net requests, the `data.ts` file should export a on object called
`requests`. The properties of this object represent different netRequest names.
These netRequest names are used by the `pubsub.publish` function to signal that
the data has changed and trigger a subscription publish. Calling
`pubsub.publish` usually happens in an input definition, but it could happen in
an infrequently triggered ECS System.

Each of the netRequest name properties on the `requests` exports a single
function which both determines whether a client should receive data and also
collects and returns the data that should be sent. The function takes three
parameters: `context` which is an instance of [DataContext](datacontext) for
that particular client, `params`, which is the parameters passed in from the
client, and `publishParams`, being whatever values are passed to
`pubsub.publish` in addition to the channel name. The second and third
`params/publishParams` parameters should always have a type annotation on it.
This is automatically picked up by the `useNetRequest` and `pubsub.publish`
functions.

#### Net Request Filters

Net Request filters are optional. The idea is to makes sure that subscriptions
are only fired for the clients that need them. For example, two clients on two
different player ships might have both requested the 'phasers' channel, but when
one of the ships charges their phasers, only the client on that ship should get
the subscription update.

To determine whether a client should receive data, the request function should
check the `params` parameter against data in the database and about the client,
like which ship the client is assigned to. If it determines that the publish
should not go to that client, it should throw `null`. This stops the rest of the
data handler from running and indicates that the client shouldn't receive that
update.

Like the example above, it's most commonly used for filtering based on the ship
the client is assigned to, though it could filter based on any other criteria.

```ts
// /client/src/cards/WeaponsControl/data.ts
export const subscriptions = {
  phasers: (context: DataContext, params: {shipId: string}) => {
    if (context.ship.id !== params.shipId) throw null;
    // ...
  },
};
```

If it never throws `null`, every client subscribed to that channel will receive
every publish.

#### Fetching Data

After filtering the subscription, the function collects the data that is needed
for the card to operate. Since it is called both when the card first loads _and_
when any subscription publishes happen, this function cannot depend on the
`publishParams` parameter. Instead, it should only use that for request
filtering.

Whatever the function returns is sent to the client and made available with the
[useNetRequest](#useNetRequest) hook. This most likely means finding specific
entities associated with the ship the client is assigned to.

```ts
// /client/src/cards/WeaponsControl/data.ts
export const subscriptions = {
  phasers: (context: DataContext) => {
    // ...
    const phaserSystems = context.flight.ecs.entities.filter(
      entity =>
        !!entity.components.phasers &&
        entity.components.shipAssignment.shipId === context.ship.id
    );

    return phaserSystems;
  },
};
```

### Suggestions for Writing Subscriptions

Subscriptions should be defined as narrowly as possible, and cards should have
as many subscriptions as are necessary to get all of the data.

Whenever creating a new subscription channel name, it's important to make sure
that `pubsub.publish` is being called any time the relevant data changes on the
server.

The `params` object passed to `pubsub.publish` should include as many values as
possible to give the subscription function as much information as is needed to
determine if the subscription should go to the client.

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

That means the rest of the data needs to be collected with a subscription.

The data for each client is sent by the
"/server/src/systems/DataStreamSystem.ts" ECS system, which also defines how
often it is sent. On this interval, the data is processed and encoded in a way
that makes it easy to do
[snapshot interpolation](https://github.com/geckosio/snapshot-interpolation#readme)
on the client.

To define the entity filter for a card, export a `dataStream` function from the
`data.ts` file, which is called for every entity. This function receives an
`Entity`, `DataContext`, and optionally `params` as parameters and should return
`true` if the entity should be sent to the client.

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

### DataStreams

The challenge with DataStreams is making sure the UI remains responsive while
updating at 60fps. React renders, while really convenient and fast enough for
most purposes, are notoriously bad at 60fps renders.

Because of that, any high-speed animation should be done using transient
updates. This basically means directly manipulating the properties of a DOM
element or Three.js Object3D instead of changing its props. You can read more
about transient updates on the
[Zustand Docs](https://github.com/pmndrs/zustand#transient-updates-for-often-occuring-state-changes)

Because of this, accessing the data from DataStreams is a two-part process:

1. Make sure the subscriptions for your card include the entities that you
   include in your DataStream definition.
2. Render the entities that you want to animate as DOM elements or Three.js
   Object3Ds.
3. In an animation loop, either with `useAnimationFrame` or the `useFrame` hook
   from React Three Fiber, loop over the entities.
4. Access the entity in the DataStream and use the position and rotation data to
   update the properties of the DOM elements or Three.js Object3Ds directly.

Even though DataStream frames are only sent from the server on an interval, we
can still render them at 60fps because of
[snapshot interpolation](https://github.com/geckosio/snapshot-interpolation#readme).

// TODO October 14, 2021 - include a code example for DataStreams

## Inputs

Inputs are the way clients can trigger mutations to server data. Inputs are
messages sent from the client to the server over WebSockets to trigger events.
Since many cards may use the same input, and to make it easier to keep track of
all of the `pubsub.publish` calls, inputs are defined separately from cards. The
list of all inputs is kept in "/server/src/inputs/list.ts".

When a client needs to update server data, it sends a message to the server with
the name of the input and any appropriate parameters as a JavaScript object.

Inputs are defined in individual files as a map of functions, with the key being
the name of the input. An instance of [DataContext](datacontext) is the first
parameter, and the `params` passed from the client are the second.

When the client sends the message, the server will call the function for that
input, which is able to perform whatever mutations it needs on the databases in
`DataContext`. It should call `pubsub.publish` for any channels it might have
modified.

Optionally, the input can return data back to the client. This return data could
be useful for automatically selecting an item in a list after it has been
created.

Inputs have error handling capabilities. They should be written such that if
invalid parameters are sent, they throw an error with an appropriate error
message. The error is returned to the client as `{error:string}`.

```ts
// /server/src/inputs/client.ts
import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";

export const clientInputs = {
  clientSetName: (context: DataContext, params: {name: string}) => {
    if (!params.name) throw new Error("name is a required parameter.");
    if (typeof params.name !== "string")
      throw new Error("name must be a string.");
    if (!params.name.trim()) throw new Error("name cannot be blank.");
    context.server.clients[context.clientId].name = params.name;
    pubsub.publish("clients");
    pubsub.publish("client", {clientId: context.clientId});
  },
  // ...
};
```

The `params` parameter should have a TypeScript annotation, which is used on the
client for type checking and auto-complete.

### `netSend`

The `netSend` function is available on the Thorium context object provided by
`useThorium()`. It is used on the client to send inputs to the server.

The first parameter is the name of the input, and the second is the `params`
object.

```ts
import {useThorium} from "../context/ThoriumContext";

function EditClientName() {
  const {netSend} = useThorium();
  const [newName, setNewName] = useState("");

  function handleEditName() {
    const result = await netSend("clientSetName", {name: newName});
    if (result.error) {
      alert("Error: " + result.error);
    }
  }

  // ...
}
```
