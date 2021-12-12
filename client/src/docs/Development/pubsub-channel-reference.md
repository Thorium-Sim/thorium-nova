---
title: Pubsub Channel Reference
---

# Pubsub Channel Reference

Any data coming from the server to the client is published to a channel which
the client subscribes to. This page serves as a reference for all existing
pubsub channels.

Pubsub channels are first described by the _subscriber_, meaning the client. For
card loaders, this is done through the `/client/src/cards/{cardName}/data.ts`
files, and most importantly the `/client/src/cards/dataList.ts` file that
exports them. For net requests, this is done through `/server/src/requests`.
More information on defining card data subscriptions can be found in the
[documentation page on cards](card-creation).

Once the data subscription has been defined, that pubsub channel can be used by
the publish function. Publishes typically happen as part of an
[ECS system update](ecs-systems) or an [input](inputs). Remember, calling
`pubsub.publish` only signals a change in data; the subscription functions
themselves define what data they get when the publish happens.

## How to use this document

Before you create a new pubsub channel name, check this list to make sure a
similar channel doesn't already exist. Also, when writing inputs or ECS systems
which publish changes, use this list to make sure every appropriate channel gets
a publish message.

Every channel name in this list should include

- The channel name
- A description of its purpose and why it might signal
- What arguments (if any) the pubsub publish should pass for the filter
  function.

## Channel Names

### Card Data Channels

### `flight`

Changes to the currently running flight, including stopping and starting.

**Filter Arguments:** None

### `flights`

Changes to any saved flight, including flight creation and deletion.

**Filter Arguments:** None

### `clients`

Changes to any connected client, including connecting, name changes, and
disconnecting.

**Filter Arguments:** None

### `client`

Changes to a specific client, including changes specific to the currently
running flight.

**Filter Arguments:**

- `clientId`: The ID of the client that changed.

### `ship`

Changes to a specific ship. The data returned from this channel should be
minimal. More specific publishes should be used for most data.

**Filter Arguments:**

`shipId`: The ID of the ship that changed.

### `station`

Changes to the station data for a specific client.

**Filter Arguments:**

`clientId`: The ID of the client.

### `theme`

Changes to the theme assigned to a specific client.

**Filter Arguments:**

`clientId`: The ID of the client.

### NetRequest Channels

### `clients`

Changes to any connected client, including connecting, name changes, and
disconnecting.

**Filter Arguments:** None

### `pluginsList`

Changes to the list of plugins, typically when a plugin is added, removed, or
renamed.

**Filter Arguments:** None

### `plugin`

Changes to a specific plugin.

**Filter Arguments:**

- `pluginId`: The ID of the plugin that changed.

### `pluginShips`

Changes to the ships templates of a specific plugin, typically when a ship is
added, removed, or renamed.

**Filter Arguments:**

- `pluginId`: The ID of the plugin that changed.

### `pluginShip`

Changes to a specific ship template of a specific plugin.

**Filter Arguments:**

- `pluginId`: The ID of the plugin that changed.
- `shipId`: The ID of the ship template that changed.

### `pluginThemes`

### `pluginTheme`

### `availableShips`

Lists all of the ships available across all of the plugins on the server.
Changes when one of those ships is added, removed, or renamed.

**Filter Arguments:** None

### `flightPlayerShips`

Lists all of the player ships on the currently active flight. Changes when one
of those ships is added or removed, or if an NPC ship becomes a player ship.

**Filter Arguments:** None

### `availableStationsList`

Lists every possible station set in all of the plugins. Changes when one of a
new station set is added, removed, renamed or when a new station is added and
removed from the station set.

**Filter Arguments:** None

### `effects`

Used for sending imperative commands to individual clients. Unlike most
NetRequests, this one intentionally includes parameters from the filter
arguments. As such, if there are no filter arguments, it will _not_ send any
data to the client.

**Payload:**

- `effect`: One of the possible effects which can be sent to the client.
- `config`: An object containing the parameters for the effect. Possibly
  includes the duration, a message, and a voice (for speech synthesis)
- `station`: Optional. The name of the station to send the effect to. Other
  available options are "all" for every station and "bridge" for the crew
  computer stations (not viewscreen).
- `shipId`: Optional. Used in connection with `station`. The ID of the player
  ship to send the effect to.
- `clientId`: Optional. The specific client to send the effect to. Must be used
  if `station` is not provided.
