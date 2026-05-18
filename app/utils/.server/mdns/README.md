# dns-sd

Pulled from https://github.com/earthstar-project/dns-sd

All files in the mdns folder are licensed GNU LGPL. The rest of the Thorium project is still licensed Apache 2.0

A module of utilities for DNS-SD (aka Zeroconf, Bonjour, Avahi), featuring:

- Advertise and browse DNS-SD services over multicast DNS (compliant with
  [RFC 6763](https://www.rfc-editor.org/rfc/rfc6763))
- A generic mDNS continuous querier (compliant with
  [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762))
- A generic mDNS responder (compliant with
  [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762))
- Utilities for encoding and decoding DNS messages to and from `Uint8Array`.
- Works with any JS runtime (e.g. Deno, Node)
- Implemented completely in TypeScript

## Motivation

This module was made so that [Earthstar](https://earthstar-project.org) can have
automatic peer discovery on a local network. Earthstar is written in TypeScript,
and can run in browsers, Deno, and Node.

I made this because there weren't any DNS-SD libraries written in TypeScript
_and_ which had service browsing _and_ service advertising _and_ which could run
on alternative JS runtimes like Deno (theoretically this module can run in the
browser, which is cool — even if it doesn't make any sense).

I also wanted something that used standard `Uint8Array` instead of Node's
`Buffer` for message encoding and decoding.

## Usage

This module works for both Deno and Node. The multicast drivers for each can be
found at the `@earthstar/dns-sd/deno` and `@earthstar/dns-sd/node` entrypoints,
respectively.

> **NB**: Deno's multicasting APIs have not yet stabilised, so the
> `--unstable-net` flag is required to use this module.

## API

### `browse`

Searches for given DNS-SD services on the local network. Returns an async
iterator of discovered services.

```ts


for await (
  const service of browse({
    multicastInterface: new MulticastInterface(),
    service: {
      protocol: "tcp",
      type: "http",
    },
  })
) {
  if (service.isActive) {

  }
}
```

### `advertise`

Advertise a service over multicast DNS.

Returns a promise which will reject if fifteen failed attempts to claim a name
are made within a ten second interval.

If the service has to be renamed due to a conflict, a warning with the new name
will be sent to the console.

```ts
await advertise({
  service: {
    host: "10.0.0.7",
    name: "My Web Server",
    port: 8080,
    protocol: "tcp",
    type: "http",
    txt: {
      psswd: "abc123",
    },
  },
  multicastInterface: new MulticastInterface(),
});
```

## Advanced API

These are lower-level APIs for directly working with DNS records. `browse` and
`advertise` are implemented using these.

### `respond`

Runs a multicast DNS responder for the given resource records.

Returns a promise that will reject when:

- Probing for proposed records fails
- Another responder starts responding with records our responder previously lay
  claim to.

```ts
await respond({
  proposedRecords: [myAAAARecord],
  multicastInterface: new MulticastInterface(),
});
```

### `Query`

A continuous multicast DNS query.

Reports additions, flushes, and expirations of resource records answering the
given query via an asynchronous iterator:

```ts
const query = new Query(
  [{ name: "_http._tcp.local", recordType: 255 }],
  multicastInterface: new MulticastInterface()
);

for await (const event of query) {

}
```

Also has an `answers` method which returns all records given as answers to this
query, as well as an `additional` method which returns all records found in the
additional section of DNS messages containing answers to our queries.

### `decodeMessage`

Decode a DNS message from `Uint8Array`.

Resource Records of the following types will have their RDATA decoded: `A`,
`PTR`, `TXT`, `AAAA`, `SRV`, `NSEC`. Other types of resource records will have
their RDATA left as `Uint8Array`.

### `encodeMessage`

Encode a DNS message as Uint8Array.

Compresses domain names, so re-encoded messages may come out smaller.

Will never use the `TC` flag in the header.

### `MulticastInterface`

This represents a network interface which has joined a multicast group. When
combined with a `MulticastDriver` it can be made to work with different runtimes
such as Deno and Node. If no driver is provided when this class is instantiated,
it automatically selects a driver appropriate to the current runtime.
