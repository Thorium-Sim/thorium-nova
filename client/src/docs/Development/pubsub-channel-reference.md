---
title: Pubsub Channel Reference
---

# Pubsub Channel Reference

Any data coming from the server to the client is published to a channel which
the client subscribes to. This page serves as a reference for all existing
pubsub channels.

Pubsub channels are first described by the _subscriber_, meaning the client.
This is done through the `/client/src/cards/{cardName}/data.ts` files, and most
importantly the `/client/src/cards/dataList.ts` file that exports them. More
information on defining card data subscriptions can be found in the
[documentation page on cards](card-creation).

Once the data subscription has been defined, that pubsub channel can be used by
the publish function. Publishes typically happen as part of an
[ECS system update](ecs-systems) or an [input](inputs). Remember, calling
`pubsub.publish` only signals a change in data; the subscription functions
themselves define what data they get when the publish happens.

## How to use this document

Before you create a new pubsub channel name, check this list to make sure a
similar channel doesn't already exist. Every channel name in this list should
include

- The channel name
- A description of its purpose and why it might signal
- What arguments (if any) the pubsub publish should pass for the filter
  function.

## Channel Names

### `flight`

Changes to the currently running flight, including stopping and starting.

**Filter Arguments:** None

### `flights`

Changes to any saved flight, including flight creation and deletion.

**Filter Arguments:** None

### `clientList`

Changes to any connected client, including connecting, name changes, and
disconnecting.

**Filter Arguments:** None

### `client`

Changes to a specific client, including changes specific to the currently
running flight.

**Filter Arguments:**

- `clientId`: The ID of the client that changed.
