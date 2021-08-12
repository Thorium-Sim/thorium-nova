# Server API

## Environment Variables

- `PORT` - Set the port for the HTTP server. Useful for headless setups.
  Defaults to 4444.
- `UDP_START` - Sets the lowest port for UDP connections. Defaults to 50000
- `UDP_RANGE` - Sets the number of ports the app uses after `UDP_START`. This is
  effectively the max number of connected clients allowed. The max port will be
  `UDP_START + UDP_RANGE`. Defaults to 200.
- `COOKIE_SECRET` - A secret key used to encrypt secure cookies. This is
  currently unused.
- `THORIUM_PATH` - The directory that will contain the data and assets for
  Thorium. Defaults to the "thorium-nova" folder in the user's Documents folder,
  eg "~/Documents/thorium-nova"

## API Endpoints

Thorium Nova has a few API endpoints which might be useful for someone building
a third-party peripheral.

All HTTP requests must be sent with a clientId to be used as context. Currently,
the clientId is sent in the clear using the `Authorization` header.

If there is an error, the request will return status code 400 with a JSON
payload that includes an error `message` property.

- `/netSend` - Sends an input to the server to mutate data, and might return a
  response. Expects a `POST` request with a JSON payload that includes an
  `input` property. This corresponds to the input that you want to trigger. Any
  other properties on the body are used as parameters for the input.

```json
{
  "input": "clientSetName",
  "name": "New Client Name"
}
```

- `/netRequest` - Requests data for a specific card. Expects a `POST` request
  with a JSON payload that includes a `card` property and a `subscription`
  property. These correspond to the specific subscription data that you want
  from that card. Currently, card subscriptions don't accept any parameters,
  though that might change as needed.
