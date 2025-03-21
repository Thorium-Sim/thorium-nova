# Architecture

## Folder Structure

- **app** - The code that is used for rendering the React frontend. This includes server code that is run in the Bun runtime. Any code that should only run on the server should use the `.server.ts(x)` extension or be in a `.server` folder. Any other code is intended to be used in both the client and the server.
- **data** - Flights and plugins used during development. The `Thorium Default` plugin is its own git repository which is used as the template for the compiled version of Thorium Nova.

## Conventions

- To make it easier to find the right input, input names should always start
  with a noun, like "phasersFire", not a verb, like "firePhasers". When sorted
  alphabetically, this groups inputs together by the thing they mutate.

## Tooling

This project uses a number of tools to maintain code quality.

- **TypeScript** - a superset of JavaScript that provides static type checking.
- **Biome** - checks code to make sure that good programming practices are
  followed. The config is very open to change and interpretation. A frustrating
  linter is worse than no linter at all.
- **Biome** - Automatically formats code. Applies code style standards so we
  don't have to think or argue about it.
- **Semantic Release** and **Conventional Commits** - Release management and
  changelog generation. When code is merged into `main`, Semantic Release will
  gather up all of the commits since the last release to generate the changelog.
  It will also take care of building and deploying the release artifacts.
- **Vitest** - Automated unit testing for the client, server, and shared project
  folders.

All of these tools will validate the code for every pull request, and pull
requests won't be merged until they are all passing. Using an IDE like VS Code
will help you catch TypeScript and Biome lint issues, and automatically run Biome format
when you save. It's still on the developer to run tests before they push their
code.

## Logical Structure

### Database

Thorium Nova uses a filesystem-based database, where the data for each saved
flight or plugin object is stored in its own JSON encoded file. When changes are made to the
datastore variable created with the `db-fs` package, it automatically knows to
persist the changes to the filesystem database. It uses a throttle to limit the
number of filesystem writes to once every 30 seconds max.

### Entity-Component-System

Thorium Nova uses
[Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system)
(ECS) for managing its game state on the server. An Entity is a single instance
of something in the game simulation. Entities are assigned components which add
attributes and identities to the components. For example, the `identity`
component assigns a name and description to entities, while the `isShip`
component identifies an entity as a ship.

Systems are classes that define the behavior of entities that have certain
components. For example, a "VelocityPosition" system only operates on entities
that have the `velocity` and `position` components, and changes the `position`
based on the `velocity`.

Component definitions are shared between the server and the client so both can
take advantage of TypeScript Intellisense. Systems are defined on the server and
operate on the list of relevant entities once ever game frame.

### Clients

An Client is an individual game window that is connected to the server. Each tab
or window of a browser is its own client. Clients are connected to the server
using HTTP and WebSockets.

### Flights

A Flight is a single instance of a game, usually coupled with a specific crew
and flight director. The flight runs the ECS world, encapsulates the game state
for the flight, and executes any systems in the simulation. 

When a flight is started or loaded from a save file, it starts up the HTTP
server, which allows other clients to connect and start playing. A single server
can only ever have one flight running at a time.

### Ships & Stations

When a flight is started, a player ship has to be spawned. This is the entity
which the crew will be controlling. Unlike many other games where each player
has their own entity to control, in a bridge simulator, players all control
certain aspects of a single entity.

The players all have different stations, and each station has the necessary
controls for their role on the ship. Stations might include Flight Control,
Weapons, Communications, or Sensors, although stations can be infinitely
configured to support as many or few crew members as is necessary. Stations are
designed such that two players can be assigned to the same station, which gives
both of them the same controls on each of their clients.

### Cards & Cores

A card is a single screen which a station shows at any given time. This is what
makes it possible to change the station configuration in so many ways. Cards
could have a single, discrete function, like activating the engines or loading
the torpedos; or they could have many functions combined into a single screen,
like controlling all engines and thrusters or loading, targeting, and firing the
weapons.

A core is the Flight Directors control for a specific piece of the simulation.
Cores operate similarly to cards - flight directors can easily change between
them as needed and use them to control the flight.

Each card or core is a React component. It also defines the server data which
that component uses. The component is responsible for rendering whatever it
needs, using the `useNetRequest` hook to request data and `netSend` to fire off
inputs to mutate server data.

#### Inputs

Any message sent from a client to the server to mutate data is called an input.
Inputs are sent over WebSockets. Inputs are defined separately from cards (since
many cards may use the same input). They are defined as a map of functions, with
the key being the name of the input. When a client needs to update server data,
it sends a message to the server with the name of the input and any appropriate
parameters. The client also includes their clientId or shipId as part of the parameters to better isolate the data cached on the client.

The server will call the function for that input, which is
able to perform whatever mutations it needs and, optionally, return data back to
the client. This return data could be useful for automatically selecting an item
in a list after it has been created.

Inputs have error handling capabilities. They should be written such that if
invalid parameters are sent, they throw an error with an appropriate error
message. The error is returned to the client as `{error:string}`.

#### High-frequency Data

High-frequency data includes anything that needs to update very quickly. This
includes ship position and rotation in space and the position of crew members
inside the ship.

Cards can define their high-frequency needs by exporting a function which is
called every game loop. It receives the list of entities and filters that list
based on the client's context. For example, only including entities which are
within sensor range of the player's ship. The server uses that list to know what
entities to send to each client each frame. The client is then responsible for
doing whatever it needs with that list.

The `dataStreamEntity.ts` file defines what data each type of entity sends to the client. This data is compressed to
save on bandwidth. Client-side, any numerical data, like positions and
rotations, can be interpolated to keep animations running smooth.

#### Low-frequency Data

Any data that updates infrequently - say twice a second or so - is considered
low frequency. This includes things like long range communications, instant
messages, sensor scans, ship metadata - anything that doesn't change very
frequently. The idea is that this data can be merged with the high-frequency
data so the high-frequency messages can be as small as possible, while the
larger low-frequency messages are sent less often. Instead of being sent every
game frame, low-frequency data is published in response to an input or
periodically by an infrequent update triggered by an ECS System.

Low-frequency data is sent over WebSockets. Clients automatically subscribe to data when they call `useNetRequest`.Any time data changes, it should call `pubsub.publish` for all of the appropriate queries that were affected. Each query procedure can define a `publish` function which determines send the data to the client or not for a given publish call.

For example, a client might not care to receive updates about another player's
ship. The first part of the subscription handler checks to see if the publish
params includes the ID of the clients ship. If it does not, the publish function returns `false` and that client doesn't get that update.

This means that the data collection process shouldn't depend on publish parameters,
since those don't exist when the client first connects and fetches initial data.
If someone tries to do this, it should become apparent that it doesn't work by
errors which are thrown when the client first connects.

#### Theming and Styling

Thorium Nova will support themes for stations. That means that anyone can write
custom CSS which is applied to the stations and cards to give them a unique look
and feel. This has a few implications.

Common elements, like buttons, inputs, and panels need to have static classes to
be used as CSS selectors. Thorium Nova will use [DaisyUI](https://daisyui.com)
as a base for most elements. DaisyUI is helpful, because it uses generic names
for states, such as 'success', 'info', and 'primary' instead of referencing
colors directly, which makes it easier to adjust the colors for each of those
states. Any elements that need extra scripting will be included in the project
as React components.

That means utility-first CSS, like Tailwind, must be used carefully to make it
easy for themes to override built-in styles. CSS-in-JS solutions aren't really
viable because of their opaque selectors.

Tailwind can be useful as a way maintain consistent design tokens while writing
CSS styles. Using Tailwind's `@apply` directive with specific classes for
elements, custom theme writers can easily target component styles and make sure
the design tokens they use in their styles are consistent.

When creating new themes in the Thorium Nova config screen, authors will write
regular CSS, but will also be able to include `@apply` rules. These will be
compiled to regular CSS when used as the station theme.

### Plugins

While Thorium Nova doesn't directly support modding, it will allow customization
of assets and gameplay. Plugins are wrappers around all the things that can be
configured in Thorium Nova, and all of these things can be edited from within
Thorium Nova. These include:

- Custom themes for the controls
- UI sound packs that play when clicking on buttons and using the controls
- Ships which fly around the 3D Starmap
- Ship systems, like engines or weapons, which are a part of these ships
- Inventory on the ship, like probe casings, coolant, and repair supplies
- Planetary systems, stars, and planets in the Starmap
- Factions, or organizations which control the planets and solar systems and
  define the behavior of ships. This would include the Federation and Klingons
  for a Star Trek universe, or the Empire and Rebellion for a Star Wars
  universe.
- Campaigns, Mission storylines, and timelines, including any visuals and
  content used during the missions

These plugins are basically configuration files bundled with assets, and can be
created within the app to modify just about anything in the simulation.

### Timelines

When a crew does a mission in Thorium Nova, it usually will follow a linear path
of discrete steps. Each step performs some action within the simulation by
firing off inputs. If a Flight Director is controlling the flight, they will
choose when to advance the timeline and fire off the inputs for each step. For
fully automated flights, event listeners will be watching for the crew to
perform some action, which will cause the timeline to progress.

Not all inputs are available to be used in the timeline. Any input that is
available on the timeline will have a simple UI for configuring its parameters.
It would be awesome if this UI was automatically generated from a schema of
inputs' parameters. Since timelines are defined well before a flight starts, and
have no guarantees about what the game state is when they execute, everything
about their configuration must be stateless.

There are two tricky things with timelines. First is creating the event listener
system for automated flights. There has to be some way to statelessly define
what things trigger the timeline to advance, including conditionally triggering
based on circumstances in the simulation.

Second is being able to use in-game entities as parameters for timeline inputs.
Remember, it has to be stateless, so there's no way of knowing what entities
might exist when the input is fired. The proposed solution is a tagging system,
where entities can be given tags when they are spawned, and timeline inputs use
those tags in their parameters. If the tagged entity doesn't exist, the timeline
input does nothing.

It might also be possible to perform a search for entities based on criteria.
For example, "any torpedo entities within 200km of the player ship".

## What Development Looks Like

Since most of the functionality in Thorium Nova is comprised by cards, most
development in Thorium Nova is going to involve only a few things:

- Creating cards and cores with data fetching functions
- Defining data with ECS Components
- Creating ECS Systems for running the game simulation
- Defining inputs & input configuration screens for Timelines
- Creating configuration screens for plugins
- Writing tests
