---
title: App Architecture
---

# App Architecture

Thorium Nova is comprised of several parts that work together to create the
complete package. These three pieces exist as separate workspaces in the
`server`, `client`, and `electron` folders in the repository.

## Server

The Node.js server is the backbone of the entire game. It is written in
TypeScript and uses esbuild to compile and bundle it into JavaScript. It
includes the logic for opening the database and persisting data when it changes,
both for the server itself, any plugins, and the currently running flight.

It also runs the ECS frameworks that are embedded into each flight, which
includes creating entities, running systems, and sending network messages to
connected clients.

Speaking of, the server keeps track of connected clients, both through Websocket
connections and WebRTC datachannels. It make sure that clients get whatever data
they need for whatever cards they might be displaying.

It also runs an HTTP server which hosts a few API endpoints which can be used by
third-party peripheral devices in addition to the static HTML and assets that
browsers can access to run the game.

One of the principles Thorium Nova is built on is that most of the game should
be playable through a modern web browser, like Google Chrome. That's why the
HTTP server serves the client assets over HTTP. This also makes it almost
trivial to create a headless version of Thorium Nova that can run for long
periods of time in the cloud.

## Electron

[Electron](https://www.electronjs.org/) is a framework for building
cross-platform JavaScript applications by bundling Node.js and Chrome into a
single executable. This allows the web technologies to access low-level APIs for
the operating system that aren't normally available to web apps. It also makes
for a nice tool to bundle the app into a distributable package.

Thorium Nova's Electron wrapper doesn't actually need to do that much. Here's
the abbreviated list of capabilities it should provide:

- Start up the HTTP server when it first launches, stop the server when Electron
  connects to another server, and then start the HTTP server again when Electron
  disconnects from another server.
- Automatically connect to that HTTP server when Electron starts up.
- Connect to another Thorium server.
- Bonjour auto-discovery for finding servers running on the network.
- Opening up `.flight` files to automatically resume an existing flight.
- Serve as a kiosk for people playing Thorium.
- Make it easier to use secure origin-only features, like WebRTC audio channels,
  WebUSB, WebMIDI, webcams, and microphones.

## Client

The client is a React application built using the
[Vite bundler](https://vitejs.dev). Everything on the frontend viewed by the
crew, flight directors, and plugin writers is part of the client. This includes
the built-in documentation (maybe that you are reading right now on the client!)

The client is organized into routes with React Router and much of its behavior
is determined by the server. For example, when a flight has started, the client
can be assigned to a ship and station. Once assigned, when the client navigates
to the `/flight` page (or something similar) it should automatically display the
controls for that station on that ship.

The Flight Director has a bit more agency when it comes to what their station
displays, having the ability to switch between different screens and views
without much difficulty.

Also important is the UI for building plugins. This plugin-building UI should be
built into Thorium Nova as much as possible and accessible from the in-game UI.
Plugin writers should be able to see the existing plugins, modify a plugin, save
and export their plugin, and maybe some day publish their plugin to
[https://thoriumsim.com](https://thoriumsim.com).
