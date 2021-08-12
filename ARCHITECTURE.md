# Architecture

## Folder Structure

Thorium Nova has five main folders for storing code. It uses NPM workspaces to
manage dependencies and run tasks in each of the folders. Check the README files
in each of these folders for more information about how they are set up
individually.

- **client** - Most of the code that is used for rendering the React frontend.
- **server** - The HTTP and game server code written in Node.js.
- **electron** - The code that runs the Electron app shell. This shell provides
  a link between the client app and the user's underlying system. It also
  launches the HTTP server.
- **shared** - Any generic code that is shared between the client and the
  server. Any code in here can be imported from the other workspaces by using
  `import x from "@thorium/x"`, with x being the name of the folder.
- **cards** - Code for cards (see below). This includes the React components
  that are rendered by the client and the data fetching functions which are
  executed on the server.

## Conventions

- To make it easier to find the right input, input names should always start
  with a noun, like "phasersFire", not a verb, like "firePhasers". When sorted
  alphabetically, this groups inputs together by the thing they mutate.
- Any unique ID should have a prefix unique to the thing that it is assigned to.
  For example, `sh-4asj5n2` for ships, `sol-ln5izonl` for solar systems,
  `sys-nsiune2` for ship systems (or maybe ship systems have more specific
  prefixes, like `pha-` for phasers and `wrp-` for warp engines), etc. This even
  applies to entities. This helps to recognize what a thing is just based on the
  ID, which is crucial when every entity lives in the same bucket.

## Tooling

This project uses a number of tools to maintain code quality.

- **TypeScript** - a superset of JavaScript that provides static type checking.
- **ESlint** - checks code to make sure that good programming practices are
  followed. The config is very open to change and interpretation. A frustrating
  linter is worse than no linter at all.
- **Prettier** - Automatically formats code. Applies code style standards so we
  don't have to think or argue about it.
- **Semantic Release** and **Conventional Commits** - Release management and
  changelog generation. When code is merged into `main`, Semantic Release will
  gather up all of the commits since the last release to generate the changelog.
  It will also take care of building and deploying the release artifacts.
- Still need to figure out how I'm going to do automated tests.

All of these tools will validate the code for every pull request, and pull
requests won't be merged until they are all passing. Using an IDE like VS Code
will help you catch TypeScript and ESLint issues, and automatically run Prettier
when you save. It's still on the developer to run tests before they push their
code.

## Logical Structure

### Entity-Component-System

Thorium Nova uses Entity-Component-System (ECS) for managing its game state on
the server. Component definitions are shared between the server and the client
so both can take advantage of TypeScript Intellisense. Systems are defined on
the server and operate on the list of entities once ever game frame.

### Clients

An Client is an individual game window that is connected to the server. Each tab
or window of a browser is its own client. Clients are connected to the server
using WebRTC for high-frequency messages, and WebSockets are used for
low-frequency messages.

Data about the currently running flight and the state of the client itself
automatically sent to the client and available to React components using the
`useClientData` hook, which uses a [Valtio](https://github.com/pmndrs/valtio)
store to facilitate updating and subscribing in React components.

### Flights

A Flight is a single instance of a game, usually coupled with a specific crew
and flight director. The flight runs the ECS world, encapsulates the game state
for the flight, and executes any systems in the simulation. Flights also contain
a list of all of the game inputs which happened during the flight, along with
the timestamp and game tick in which they happened. This makes it possible to
replay events of the flight, or rewind a certain amount of time

When a flight is started or resumed, it starts up the HTTP server, which allows
other clients to connect and start playing. A single server can only ever have
one flight running at a time.

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
both of them the same controls on their client.

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

Thorium Nova uses state snapshots for sending data from the server to the
client. Since the server already knows what station and cards are assigned to
any given client, it is automatically able to send the correct state to each
client based on the data needs of the cards that client is displaying.

Each card or core is a React component. It also defines the server data which
that component uses. The component is responsible for rendering whatever it
needs, using the `useCardData` hook to access its data, and `useInput` hook to
fire off inputs. Card data is stored in a separate
[Valtio](https://github.com/pmndrs/valtio) proxy store.

#### Inputs

Any message sent from a client to the server to mutate data is called an input.
Inputs are sent over WebSockets. Inputs are defined separately from cards (since
many cards may use the same input). They are defined as a map of functions, with
the key being the name of the input. When a client needs to update server data,
it sends a message to the server with the name of the input and any appropriate
parameters. If the client is associated with a ship and station, those are
included as context. The server will call the function for that input, which is
able to perform whatever mutations it needs and, optionally, return data back to
the client. This return data could be useful for automatically selecting an item
in a list after it has been created.

Inputs have error handling capabilities. They should be written such that if
invalid parameters are sent, they throw an error with an appropriate error
message. The error is returned to the client as `{error:string}`.

#### High-frequency Data

High-frequency data includes anything that needs to update very quickly. This
includes ship position and rotation in space and the position of crew members
inside the ship. High-frequency data is sent over WebRTC, unless it isn't
available and it falls back to WebSockets.

Cards can define their high-frequency needs by exporting a function which is
called every game loop. It receives the list of entities and filters that list
based on the client's context. For example, only including entities which are
within sensor range of the player's ship. The server uses that list to know what
entities to send to each client each frame. The client is then responsible for
doing whatever it needs with that list.

Each ECS component exports a schema which can be used to compress that entity to
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

Low-frequency data is sent over WebSockets. Cards define which publishes they
will subscribe to by including a file called "subscriptions.ts". This file
exports a map where the keys are subscription names. The value is an object that
has a "fetch" function and optionally a "filter" function. If present, the
"filter" function is called with the parameters passed to the publish function,
and returns a boolean which lets the subscription handler know whether it should
handle the data or not.

For example, a client might not care to receive updates about another player's
ship. The "fetch" subscription handler can then collect additional data
deterministically from the database. Whatever the "fetch" subscription handler
ends up being sent back to the client. Having a separate "filter" and "fetch"
function makes it possible to send initial data when the card first connects.

The benefit of this approach is the data fetching for a card is collocated with
the card itself. The extra "subscriptions.ts" file makes it friendly with server
auto-restart without making the server restart every time any card file is
changed.

This certainly could be improved, but at the same time both the filter and the
fetch functions depend on specific context for each client. If there is any
performance hits, this is a place that could be looked at.

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
