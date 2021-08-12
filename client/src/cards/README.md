# Cards & Cores

This folder contains the React components and data requirements for the Cards
and Cores in Thorium Nova. These are the main UI building blocks.

Each Card is an individual screen that contains all of the controls and switches
to perform some function on the Simulator. Cards can be granular, such as a card
that only raises and lowers the shields, or a card that organizes and relays
orders to security teams; cards could also combine functionality, such as a card
that shows a sensor grid, navigation controls, and weapons controls on a single
screen for single-player simulations.

Cores are used by the Flight Director to adjust individual aspects of the
simulation. Like Cards, Cores can be individual and granular, like changing the
alert condition or setting a timer; or they can combine many functions together,
like displaying all of the ships in a solar system on a starmap, along with
metadata about those ships.

## Conventions

Cards and Cores are all exported from the `index.ts` file located in this
folder, each in their own list. Both should be React components that are more or
less self-contained. Card identifiers should just be the name of the card, like
"WeaponsControl" or "Navigation", while Cores should append "Core" to the name,
like "SystemsCore" and "DamageControlCore".

## DataContext

There is a fairly common type used in the data fetching functions called
`DataContext`. This represents data and methods associated with a specific
client that should be available any time there's data fetching happening. It
includes the client's ID, a reference to the server data store which includes
all of the client objects, the flight data store which includes the ECS world
and all of the entities, and several getter functions to make accessing things
easier, like the ship entity that the client is assigned to.

## Defining Data Dependencies

Data is handled separately from the components themselves, to make sure the
server doesn't have to load more code than it needs to, and vice versa. Data
needs are defined in a `subscriptions.ts` file inside the card folder. There are
two exports from this file: One for low-frequency subscriptions and another for
high-frequency data streams.

### Subscriptions

Subscriptions are intended for low-frequency (less than twice a second) updates
that might have larger data payloads. This is the most commonly used method for
transferring data from the server to the client.

Subscriptions are defined by exporting a `subscriptions` object from
`subscriptions.ts`. The properties of this object represent different
subscription action names. These action names are used by the `pubsub.publish`
function to actually trigger sending the data to the client. Calling
`pubsub.publish` usually happens in an input definition, but it could happen in
an infrequently triggered ECS System.

Let's look at a complete example to see how all the parts work together.

```ts
// /client/src/cards/WeaponsControl/subscriptions.ts
export const subscriptions = {
  phasers: {
    filter: (params: {shipId: string}, context: DataContext) => {
      return context.ship.id === params.shipId;
    },
    fetch: (context: DataContext) => {
      const phaserSystems = context.flight.ecs.entities.filter(
        entity =>
          !!entity.components.phasers &&
          entity.components.shipAssignment.shipId === context.ship.id
      );

      return phaserSystems;
    },
  },
};

// /server/src/inputs/phasers.ts
export const phasersInput = {
  phasersCharge(context: DataContext, params: {phaserId: number}) {
    const phaserEntity = context.flight.ecs.getEntityById(params.phaserId);
    phaserEntity.components.phasers.charging = true;
    pubsub.publish("phasers", {
      shipId: phaserEntity.components.shipAssignment.shipId,
    });
  },
};
```

We'll go through each of these pieces one by one. Check out the
`/server/src/inputs/README.md` file for more information on inputs.

#### Action Name

The property names of the `subscriptions` object are the action names which are
used by `pubsub.publish`. These action names are not unique across all of
Thorium Nova, since many cards might rely on the same `pubsub.publish` calls to
trigger subscriptions. This does mean that the `filter` function for a given
action name should have the same params across all of Thorium Nova.

TypeScript will automatically add type checking and autocomplete for these names
when you use `pubsub.publish`.

#### filter (Optional)

The filter function takes two parameters - the publish params and DataContext -
and returns a boolean. This function is called for each client. If the function
returns true, then that client will get a subscription update; otherwise it
won't. If this function is omitted, every client will get the subscription
update when `pubsub.publish` is called.

The first `params` parameter should always have a type annotation on it. This is
automatically picked up by the `pubsub.publish` function.

#### fetch

The required fetch function only receives the DataContext for a given client.
Using only that, it grabs the necessary data that corresponds to that particular
subscription for that particular client. This most likely means finding specific
entities associated with the ship the client is assigned to. Whatever is
returned by this function will be sent to the client.

The fetch function doesn't take any extra parameters, because it has to be
called when the client first connects, and aside from the data context, the
server doesn't know anything else about the client's state.

#### pubsub.publish

The publish function is available through the `pubsub` module located in
`/server/src/utils/pubsub.ts`. It's called with a subscription action name, and
optionally any params which are sent to the `fetch` function.

#### Suggestions for Writing Subscriptions

Subscriptions should be defined as narrowly as possible, and cards should have
as many subscriptions as are necessary to get all of the data.
