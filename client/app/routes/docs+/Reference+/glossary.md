---
title: Glossary
order: 1
---

# Glossary

## Ship

In the context of Thorium, the simulator is the computer representation of ships
which fly around in space. The crew’s ship is called the Player Ship; other
ships are called NPCs. Ships consist of **Systems**, **Stations**, decks, rooms,
and crew.

## Flight Director (FD)

The game master of the simulation. Flight Directors manage the back end of the
controls, using them to tell the story. They are also in charge of the lighting,
sound effects, voices, actors, and everything else involved in running the
simulation.

## Crew

The people flying the spaceship on the bridge. They act out their role as a
member of the crew of the spaceship. Crew members typically are split into
several different **Stations**, or jobs. Their goal is to complete the mission
successfully.

## Client

A client is a single computer running a **Station**. To run Thorium, you must
have at least one client for every **Station** in the simulation (except the
Captain), but you could have multiple clients running the same **Station** on
larger bridges. Each crew member (except the Captain) should have at least one
client computer.

## Plugin

A collection of Thorium objects intended to be used together. These include
**Universes**, **Ships**, **Systems**, and **Missions**, among other things.
They also include all the data and assets associated with those objects.

## Flight

A Flight is a single instance of a game, usually coupled with a specific
**Crew** and **Flight Director**. The Flight encapsulates the universe and
simulation which run during the duration of that Flight, making it possible to
pause, save the Flight state, and reload it at a later time. Flights also
contain a list of all of the **Inputs **which happened during the Flight, along
with the timestamp and game tick in which they happened. This makes it possible
to replay events of the flight, or rewind a certain amount of time in the game.

## Bridge

A Bridge is the physical space where a simulation happens. It could be permanent
and include a bridge, desks for the computers, a sickbay and engineering room,
hallways, transporter doors, etc. Or it could be your living room and computers
for every participant. There is no set definition of what your spaceship has to
look like! Thorium allows you to map the **Clients** in your physical bridge set
to **Simulators** and **Station Complements** so you can easily start the ship
before a flight.

## Card

A screen that contains all of the controls and switches to perform some function
on the **Simulator**. Cards can be granular, such as a card that raises and
lowers the shields, or a card that organizes and relays orders to security
teams; cards could also combine functionality, such as a card that shows a
sensor grid, navigation controls, and weapons controls on a single screen for
single-player simulations.

## Station

A collection of cards that has all of the controls necessary for a single role
on the ship, such as Flight Control or Tactical. Crew members can switch between
**Cards** at will as needed. This is also commonly a synonym for **Client.**

## Station Complement

A collection of **Stations** that represents all of the people necessary to run
the **Simulator**, including the Captain. Typical bridge simulators have a
Station Complement of 6 **Stations** (Captain, Flight Control, Tactical,
Communications, Science, and Engineering). Thorium Nova supports compiling any
number of **Stations** together to create bridge simulators for any size of
crew. Typically the Captain does not have a computer screen, but should still be
considered an important part of the Station Compliment.

## Core

The controls which the **Flight Director** uses to control the simulation. This
includes a view of the **Star Map**, the **Ship Map**, the **Core Feed**, the
**Timeline**, and a place to open and use any **Core Module** at will.

## Universe

A collection of interstellar systems, stars, planets, and other celestial
objects which appear on the **Star Map**. These objects are all static and do
not move or change much during the simulation.

## Star Map

The view into the **Universe** which is available to the Flight Director,
Viewscreen, Flight Control, and other stations. It also includes all the
**Ships**, starbases, weapons, and other moving objects.

## System

The equipment on the ship which gives it abilities. These are controlled by the
bridge crew through **Cards** and include things like Warp Engines, Phasers, and
the Cloaking Device. Systems typically have power requirements, a damage state,
an efficiency value, and possibly a heat value. Each type of system bestows
certain abilities to the ship that is using it.

## Viewscreen

The screen at the front of the **Bridge** which almost always shows a view
outside the ship, powered by the 3D Universal Sandbox. Information and alerts,
called **Overlays,** can be displayed on the viewscreen, overlaid over the
outside view. On rare occasions, the viewscreen could be replaced with a
full-screen image, diagram, or video.

## Theme

The visual style of each of the **Stations** on the **Simulator**. It defines
the frame around the screen, the appearance of the buttons and other controls,
the user interaction sound effects, and the different colors in different alert
conditions.

## Effect

A command sent to stations which makes them do something, such as play a sound,
flash, spark, display a message, speak using speech synthesis, or display an
offline card.

## Ambiance

Background sound which plays on the **Bridge**. It provides a sense of power and
presence to the **Bridge**, making it feel like you are actually inside a
spaceship. Ambiance can be adjusted based on the status of the **Simulator**.
For example, if the reactor is powered down, ambiance should change. It should
also change when warp engines are activated, etc.

## Timeline

A mission definition. The mission is the storyline; the timeline is how that
storyline is codified into Thorium Nova. The timeline is configured as a series
of steps, each step describing what the **Flight Director** should do as well as
a number of **Inputs **that should be triggered at that point in the mission**.
**During the flight, the timeline is available on the **Core** for the **Flight
Director** to review and advance.

## Input:

Something which causes a change in the simulation. Inputs are triggered by
clicking on the controls, or activating a timeline step. There are three kinds
of inputs: _Flight inputs_ are applied to the currently active flight. These are
stored in a list so the flight can be replayed later. There are also _Server
inputs \_which are used for managing the server outside of the flight. Finally,
there are \_Timeline inputs_, which trigger other flight inputs, such as mission
**Timelines **or **Macros**. When defining groups of inputs on a **Timeline** or
in a \*\*Macro\*\*, delays between inputs can be set by placing a special
“Delay” input between the inputs. An input’s primary event handler is able to
return data to the client that triggered the input. This is useful for
automatically selecting an item in the UI after it has been created.

## Macro

A series of **Inputs** defined together and executed at the same time.

## Event

After an **Input** happens, events are triggered. An event is the combination of
an event type and parameters and the context of that event. For example, the
type could be “phasersFire”, the parameters are the ID of the phaser bank, and
the context is the client, simulator, and station that triggered the event.
Event listeners can be created and removed to automatically perform other
actions in response to events. This can be used to automatically advance
timelines or have special reactions to when certain things happen.

## Subscription

Card definitions define the data that the card needs. When the card is loaded by
a client, it automatically is sent the necessary data. There are two kinds of
subscriptions**: High Frequency** is used for data that updates frequently, like
ship movements, entities on the marauders map, etc. **Low Frequency** is used
for anything that updates once per second or less or in response to inputs. Low
Frequency subscriptions only update in response to a Publish.

## Publish

A command issued on the server to send an update to connected clients. Publishes
usually happen in response to an Input, as part of an Event listener’s action,
or during some automated process.

## Task Definition

The definition of some task which a crew member can do. Tasks involve performing
a certain number of **Inputs **to get some part of the simulation state to match
a certain end state. The completion of the task is determined by whether the
current state matches the end state. For example, if the shields are lowered, a
valid task would be to raise the shields. Once the shield state is “raised”, the
task is marked as completed.

## Task Report

An ordered collection of tasks intended to repair a ship **System** or
accomplish some task when all of the steps are completed. Tasks are to be
completed in order - later tasks are not assigned until the tasks preceding are
completed.
