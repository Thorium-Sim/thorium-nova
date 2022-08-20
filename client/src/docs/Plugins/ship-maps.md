---
title: Ship Maps
order: 3
---

# Ship Maps

_TODO: Explanation here about what ship maps are and how they impact the
simulation._

## Building Ship Maps

Ship maps consist of three things: Decks, which include a background image that
shows what that deck looks like, Nodes, which are points of interest on the
deck, and Edges, which are straight lines that connect the nodes. Nodes most
typically are rooms, but they are also used to direct the edges. For example,
several nodes can be connected in a curved shape to allow for circular walkways.

Cargo and crew members can move between nodes using edges. _TODO: Add more
explanation here about how nodes and edges are constructed._

Each ship class includes the full definition for the ship map. As you are
creating ship maps for new ships, keep these guidelines in mind.

### Plan Out your Rooms

There are a lot of factors that go into how many and what rooms your ship should
have. You'll need to consider the size and length of the ship, the number of
crew you want to have, rooms for any extra passengers, and the required rooms
necessary for the ship to function. Every ship system should have at least one
room associated with it (although multiple systems can share a room). Crew also
need a room to sleep in. Additional rooms, like science labs, gymnasiums, and
lounges, are optional but can add additional depth to your ship.

The deck count also plays a role in this. Once you figure out the length of your
ship, you can use the calculated height (based on the 3D model of the ship) to
determine the number of decks. If your crew is human with an average height of
1.8 meters, it's safe to assume the decks are 3 meters high. Divide the total
height of the ship by 3 and round down to get the number of decks.

The rooms on each deck will conform to the shape of the ship at that level. It
might be helpful to use software to create slices in the 3D model where each
deck would be to get an idea for the shape of the deck. With that shape, you can
begin to sketch out how the hallways are laid out and the size and shape of each
room. Don't forget to include the bridge, which is the room the player crew will
be in.

### Design the SVG

The background image for each deck should be an SVG, although any image format
is compatible. SVGs provide the most flexibility, since they can be dynamically
altered by the controls (to change colors for the current alert condition, for
example), can scale infinitely, and have a small file size. Creating SVGs is
possible with tools like Adobe Illustrator, Affinity Designer, Inkscape, and
many online tools.

Thorium Nova will automatically scale your background image so its width matches
the configured length of the ship, meaning the ship map is always displayed with
the ship pointed horizontal. For non-SVG background images, that means you
should make your deck image width a multiple of the ship's length.

It's also best to make all of the background images for each deck the same size,
even if each deck is bigger or smaller. That helps to line up the decks on the
screen as the crew flips through them.

While the actual construction of the SVG is irrelevant, it might be helpful to
create separate paths for each room to better organize them. Don't forget to
include a hallway and places where the crew can move between decks.

The design is also up to you, but the standard for Thorium Nova is to have the
ship background have a black fill with a white outline, and for all of the rooms
to have a stroke but no fill. The hull of the ship has a 3 point stroke, the
hallway has a 2 point stroke, and each of the rooms has a 1 point stroke.

If you want your SVG to change colors with the alert condition, you'll have to
manually edit it in a text editor after designing it. Change the stroke color
for all of the paths to `currentColor`, as in
`<path stroke="currentColor" ... />`. This lets Thorium Nova change the color of
the SVG.

### Create the Decks

In Thorium Nova, go to the ship plugin editor, pick your ship, and start adding
decks. Upload the background image for each deck and change the name, if
necessary. If you need to reorder decks, you can do that by dragging the decks
above or below each other.

### Add the Nodes and Edges

_TODO: Will add this later, once nodes and edges are implemented._

### Assign Extra Properties to Nodes and Edges

_TODO: Will add this later, once nodes and edges are implemented._
