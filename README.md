[![Discord](https://img.shields.io/discord/390968011605147648.svg)](https://discord.gg/UvxTQZz)
[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors)
![Version](https://img.shields.io/github/package-json/v/thorium-sim/thorium-nova)
![GitHub last commit](https://img.shields.io/github/last-commit/thorium-sim/thorium-nova/develop)

# Thorium Nova

## The Future of Bridge Simulation

_Want to help contribute? Check out the
**[contributing document](CONTRIBUTING.md)**._

This is the main repository for Thorium Nova, a multiplayer real-time bridge
simulator game. To learn more about what Thorium Nova is, check out
https://thoriumsim.com.

## Development Quick Start

I recommend using [Volta](https://volta.sh) to manage your Node and NPM
versions, since it will automatically install the correct version when you work
on Thorium Nova. If you're on Windows, I also recommend
[using WSL](https://docs.microsoft.com/en-us/windows/wsl/install), although
others have had success in Windows.

First
[install git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and
run this command to download the code:

```bash
git clone https://github.com/Thorium-Sim/thorium-nova.git
```

Once the project has been cloned, you can install dependencies using NPM and
start the project.

```bash
npm install
npm run dev
```

This will automatically start the client and development servers and open up the
UI in your web browser. If it doesn't automatically open, you can open it
yourself by going to http://localhost:3000.

## Project Vision

Thorium Nova is a platform for creating powerful narrative experiences in a
starship bridge simulator. In these bridge simulations, crew members are given a
specific mission and must work together, using their different roles and
functions to accomplish their goals. Thorium Nova prioritizes story over
action - the crew should feel like they are actors on the set of a science
fiction show. The crew might have a Flight Director, orchestrating their mission
behind the scenes.

The purpose of Thorium Nova is to facilitate these experiences. This includes a
simulated universe for the stories to take place in, controls for the crew
members and flight director, a viewscreen and other methods for the crew to
interact with the universe, a way to write and run mission storylines, show
controls like lights, sound effects, music, and video to help the crew become
immersed, automation to help the flight director, training and documentation for
both the crew and flight director, and ways to customize the experience for any
audience.

Thorium Nova is also an open source project that depends on volunteer
contributions. Since this project would die without the help and support of the
community, every effort should be made to welcome and encourage contributions
from anyone willing to help. Since Thorium Nova is a code-heavy project, this
especially includes making the codebase as approachable as possible for
developers.

Thorium Nova's primary audience is casual gamers and hobbyists who want to run
simulations for their friends and families. Thorium Nova might also be useful
for brick-and-mortar space centers and simulators set up at conventions, but it
must first be fun and usable for living room play.

Thorium Nova has a few guiding principles and values to follow as we work on the
project:

- **Collaboration** - Whether that means collaboration between the flight
  director and crew to tell a great story, between the different crew members'
  stations, or between developers and other contributors.
- **Simplicity** - By including 3D universe and internal crew simulations,
  Thorium Nova is inherently a complex project. However, every effort should be
  made to keep each of the smaller parts simple. The complexity should emerge
  from interactions between simple parts. One example of this in action is the
  [Entity Component System simulation](https://en.wikipedia.org/wiki/Entity_component_system),
  where simple systems create complex interactions between components. This
  principle also means saying no to well meaning features that add undue
  complexity.
- **Beginner Friendly** - The controls should be simple and intuitive for both
  the flight director and the crew, with appropriate documentation and tutorials
  for each of them. It should be easy to get started. An experienced D&D Dungeon
  Master should easily learn how to be a flight director. Likewise, it should be
  easy for a new contributor or developer to become familiar with the Thorium
  Nova project and codebase.
- **Configurable** - Thorium Nova is going to ship with it's own stories, lore,
  universe, and mechanics. That doesn't mean it can't be used to tell stories in
  other universes. The controls should consider those possibilities, and make it
  possible to configure the experience to suit whatever stories the flight
  directors and mission writers want to tell.
- **Fun** - Crews, flight directors, and contributors should enjoy working with
  Thorium Nova. It should spark creativity, excitement, and wonder. Being Flight
  Director should be just as much fun as being a crew member; likewise, people
  should want to contribute to Thorium Nova because they enjoy doing it.
