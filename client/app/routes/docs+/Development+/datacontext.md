---
title: DataContext
---

# DataContext

To keep implementation details decoupled, the context for every data fetching
function and every server input is passed in as a parameter called
`DataContext`. This object represents data and methods associated with a
specific client that is making the request and should be available any time
there's data fetching happening. The DataContext is defined in
"/server/src/utils/DataContext.ts".

## `clientId`

**Type**: `string`

The ID of the client making the request or receiving the subscription response.

## `database`

**Type**: `{server: ServerDataModel; flight: FlightDataModel | null}`

A reference to the persistent server database and the database for the current
flight, if there is one in progress.

## `server`

**Type**: `Readonly<ServerDataModel>`

A convenience property for accessing the server database.

## `flight`

**Type**: `FlightDataModel | null`

A convenience property for accessing the current flight database, if there is
any.

## `client`

**Type**: `ServerClient`

A convenience property for accessing the permanent client object in the server
database.

## `flightClient`

**Type**: `FlightClient | null`

A convenience property for accessing the flight client object in the current
flight database, if there is any. It will automatically create an entry for the
client in the flight database the first time it is accessed.
