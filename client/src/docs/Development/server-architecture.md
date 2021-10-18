---
title: Server Architecture
---

# Server Architecture

Thorium Nova is comprised of several parts that work together to create the
complete package. These three pieces exist as separate workspaces in the
`server`, `client`, and `electron` folders in the repository.

## Server

The Node.js server is the backbone of the entire game. It includes the logic for
opening the database and persisting data when it changes, both for the server
itself, any plugins, and the currently running flight.

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

The server is written in TypeScript and uses esbuild to bundle the assets.

## Client

The client is a React application

## Electron
