---
title: Net Requests
---

# Net Requests and Net Sends

Net Requests are the primary way of getting data from the server to the client.
Net requests return initial data when they first load and send updates whenever
`pubsub.publish` is called with the same `topic` as the net request.

Likewise, Net Sends are how the client updates the server. They update the
database and can call `pubsub.publish` to tell net requests to send fresh data
to the client.

Both work like functions which the client can call to automatically handle
fetching the data and subscribing to any changes.

> Why netRequest and netSend?
>
> When the first networked controls were developed for the CMSEC back in the
> 1990s, they were created with Hypercard and used AppleTalk for sending
> networking messages. The programmer created an abstraction for peer-to-peer
> communication which used the `netSend` command to send messages to another
> station and `netRequest` to request data from another station. Thorium Nova
> recognizes the these Hypercard controls by using a similar API.

## Defining Routers

Routers include both requests and sends, and can be defined anywhere in the
client or server directories, though to work properly with server reloading and
TypeScript includes settings, they should either be in files named `data.ts` or
in folders named `/data/`. The intention is for routers to be closely collocated
with the files and components that use them. Each file can export a full router,
several nested routers, or individual procedures - whatever makes the most
sense.

Take a look at this example which includes both a request and a send:

```ts
import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {getShipSystem} from "@server/utils/getShipSystem";
import {z} from "zod";

export const pilot = t.router({
  impulseEngines: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        // Currently only support one impulse engines
        const impulseEngines = getShipSystem(ctx, {
          systemType: "impulseEngines",
        });
        return {
          id: impulseEngines.id,
          targetSpeed:
            impulseEngines.components.isImpulseEngines?.targetSpeed || 0,
          cruisingSpeed:
            impulseEngines.components.isImpulseEngines?.cruisingSpeed || 1,
          emergencySpeed:
            impulseEngines.components.isImpulseEngines?.emergencySpeed || 1,
        };
      }),
    setSpeed: t.procedure
      .input(z.object({systemId: z.number().optional(), speed: z.number()}))
      .send(({ctx, input}) => {
        if (!ctx.ship) throw new Error("No ship found.");

        const system = getShipSystem(ctx, {
          systemId: input.systemId,
          systemType: "impulseEngines",
        });

        if (!system.components.isImpulseEngines)
          throw new Error("System is not a impulse engine");

        system.updateComponent("isImpulseEngines", {
          targetSpeed: input.speed,
        });

        pubsub.publish.pilot.impulseEngines.get({
          shipId: ctx.ship?.id,
          systemId: system.id,
        });
        return system;
      }),
  }),
});
```

To create a router, we must:

1. Import any necessary modules, such as t and pubsub in this example.
1. Create a top-level router by calling `t.router({})`. This will define a
   namespace for a group of related routes.
1. Within the top-level router, define a sub-router for each specific route by
   calling `t.router({})` and passing in an object with the desired route names
   as keys.
1. For each route, define a procedure by calling `t.procedure`.
1. Optionally, use the `.input()` method to define the shape of the request
   payload. This is done using the [`zod`](https://github.com/colinhacks/zod)
   library, which provides both type checking and input parsing.
1. Optionally, add filters to the procedure by calling the `.filter()` method
   and passing in a function. This function is called whenever `pubsub.publish`
   is called for a request. The function should include a type definition for
   the first `publish` parameter, which is what is passed to `pubsub.publish`.
   The function should return true if the `pubsub.publish` should send updated
   data to that particular client, or `false` if it should be ignored. `filter`
   is not necessary for sends.
1. Define the request or response handling logic for the route by calling the
   `request()` or `send()` method and passing in a function that specifies the
   desired behavior. That function receives an object which includes the
   following:
   - `ctx`: The [DataContext](/docs/development/datacontext) object for that
     particular client.
   - `input`: The user input defined by the `.input()` schema.
   - `publish`: The value passed to `pubsub.publish`. This is always `null` for
     the very first request.
1. Within sends, you can use `pubsub.publish` to publish any requests that might
   be affected by the change the send makes to the database. It's not a good
   idea to use `pubsub.publish` in requests.

## Using NetRequests

On the client, net requests are made by using the `useNetRequest` hook, which is
chained from the `q` helper in `@client/context/AppContext`. The first parameter
is any inputs to the request, and the second parameter is
[React Query's useQuery options](https://tanstack.com/query/v4/docs/react/reference/useQuery).

This function returns an array where the first item is the data itself and the
second is the results from React Query's useQuery function. This makes it easy
to pull out just the data, while retaining the ability to access any of the
other data. The data will automatically be updated when new data is published
from the server.

```ts
const [{id: impulseId, targetSpeed}] =
  q.pilot.impulseEngines.get.useNetRequest();
```

Behind the scenes, this uses React Suspense to fall back on a suspense component
whenever data is loading.

NetRequests use a cache to prevent duplicate data or unnecessary requests. The
cache is keyed by the name of the parameter and the hashed params, so you can
make the same netRequest multiple times without any additional network overhead.

If you ever need to imperatively make a request, such as for a dynamic search
field, you can instead use the `netRequest` chain, which takes the request input
and returns a promise that resolves to the requested data.

```ts
const result = await q.cargoControl.search.netRequest({query: "Phasers"});
```

## Using NetSends

NetSends are inputs define the messages that can be sent from any client to the
server. The term "inputs" is used in game development to represent any kind of
input made my a keyboard, mouse click, gamepad, touchscreen, etc.

NetSends are sent to the server using HTTP POST requests, update data on the
server and perform other mutations and effects, and optionally return a JSON
response. That JSON response is helpful when an input creates a new object that
immediately should be selected in the client UI.

NetSends are triggered the same way as netRequests, but the end chain is
`netSend`, which behaves the same as `netRequest`, but for sends, or
`useNetSend`, which wraps
[React Query's useMutation hook](https://tanstack.com/query/v4/docs/react/reference/useMutation).
In most cases, you'll want to use `netSend`. `useNetSend` is helpful when you
need to track the loading state of a mutation in flight, such as the mutation
which starts a flight.

## File Uploads with Inputs

NetSends can also be used to upload files. This functionality should likely only
be used for plugin configuration, but maybe someday it could also be used for
uploading profile pictures which are added to thoriumsim.com.

When defining an input that supports uploads, the params object should define
properties that use the type `File | string`. The `File` type is used for the
`netSend` call to let it know you can pass a `File` object or `Blob` to it. The
`string` type is used on the server.

When the file is uploaded, the server will automatically save it to a temp file
with the appropriate extension (.png, .jpg, .svg, etc.) and use that temp file
path as the value of that property in the `input` object. The NetSend resolver
can then move the file with `fs.rename` to whatever place it needs to be.

In this example, I check to make sure the `coverImage` param is a `string`,
generate the appropriate file path for the image to be uploaded to, ensure that
the directory exists with `fs.mkdir`, and then move the file with `fs.rename`.

```ts
export const plugin = t.router({
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        coverImage: z.union([z.string(), z.instanceof(File)]).optional(),
      })
    )
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);

      if (typeof input.coverImage === "string") {
        const ext = path.extname(input.coverImage);
        const coverImagePath = path.join(
          thoriumPath,
          plugin.pluginPath,
          `assets/coverImage${ext}`
        );

        await fs.mkdir(path.dirname(coverImagePath), {recursive: true});
        await fs.rename(input.coverImage, coverImagePath);
        plugin.coverImage = `${plugin.pluginPath}/assets/coverImage${ext}`;
      }
      publish(plugin.id);
      return {pluginId: plugin.id};
    }),
});
```

Then, on the client side, you can use the `netSend` helper to upload the file
merely by including it as a param. The `netSend` function will take care of
packaging it up properly.

```tsx
const PluginCoverImage = plugin => {
  // ...
  return (
    <UploadWell
      accept="image/*"
      onChange={(files: FileList) => {
        if (!plugin) return;
        q.plugin.update.netSend({
          pluginId: plugin.id,
          coverImage: files[0],
        });
      }}
    >
      {plugin?.coverImage && (
        <img
          src={`${plugin.coverImage}?${new Date().getTime()}`}
          className="w-[90%] h-[90%] object-cover"
          alt="Cover"
        />
      )}
    </UploadWell>
  );
};
```

You can upload as many files as you want in a single `netSend` call, either by
passing multiple params or by using `FileList | string` as the the type of the
param.
