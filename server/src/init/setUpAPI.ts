import {ServerDataModel} from "../classes/ServerDataModel";
import {DataContext} from "../utils/DataContext";
import type buildHTTPServer from "./httpServer";
import inputs, {AllInputNames} from "../inputs";
import requests, {AllRequestNames} from "../netRequests";
import {
  cardSubscriptions,
  DataCardNames,
  SubscriptionNames,
} from "client/src/utils/cardData";
import {FlightDataModel} from "../classes/FlightDataModel";
const NETSEND_PATH = "/netSend";
const NETREQUEST_PATH = "/netRequest";
const CARDREQUEST_PATH = "/cardRequest/:card/:subscription";

function checkBody(body: any, clientId: string) {
  if (typeof body !== "object") throw new Error("Body must be a JSON object");
  if (!clientId)
    throw new Error(
      "Every event request must have a client ID. Assign it by passing an 'authorization' header like 'Bearer {clientId}'"
    );
}
function checkBodyInput(
  body: any,
  clientId: string
): asserts body is {input: AllInputNames} {
  checkBody(body, clientId);
  const bodyObject = (body || {}) as object | {input: AllInputNames};
  if (!("input" in bodyObject))
    throw new Error(
      "Invalid event input. It must be a JSON body with a `input` property."
    );
  if (!(bodyObject.input in inputs)) {
    throw new Error(
      `Invalid event input. "${String(
        bodyObject.input
      )}" is not a valid input name.`
    );
  }
}
function checkBodyNetRequest(
  body: any,
  clientId: string
): asserts body is {request: AllRequestNames} {
  checkBody(body, clientId);
  const bodyObject = (body || {}) as object | {request: AllRequestNames};
  if (!("request" in bodyObject))
    throw new Error(
      "Invalid event input. It must be a JSON body with a `request` property."
    );
  if (!(bodyObject.request in requests)) {
    throw new Error(
      `Invalid request name. "${String(
        bodyObject.request
      )}" is not a valid request name.`
    );
  }
}
function checkBodyCardRequest(
  body: any,
  clientId: string
): asserts body is {
  card: DataCardNames;
  subscription: SubscriptionNames;
} {
  checkBody(body, clientId);
  const bodyObject = (body || {}) as
    | object
    | {card: DataCardNames; subscription: SubscriptionNames};

  if (!("card" in bodyObject))
    throw new Error(
      "Invalid event input. It must be a JSON body with a `card` property."
    );
  if (!cardSubscriptions[bodyObject.card])
    throw new Error(
      `Invalid card name: ${bodyObject.card}. Valid cards are ${Object.keys(
        cardSubscriptions
      )
        .map(c => `'${c}'`)
        .join(", ")}`
    );
  const cardSubs = cardSubscriptions[bodyObject.card];
  if (!(bodyObject.subscription in cardSubs))
    throw new Error(
      `Invalid subscription for card '${bodyObject.card}': ${
        bodyObject.subscription
      }. Valid subscriptions are ${Object.keys(cardSubs)
        .map(s => `'${s}'`)
        .join(", ")}`
    );
}
export function setUpAPI(
  app: ReturnType<typeof buildHTTPServer>,
  database: {
    server: ServerDataModel;
    flight: FlightDataModel | null;
  }
) {
  // This just maps all of the inputs to a single HTTP endpoint.
  // In the future, this could be changed to make it so each of
  // these is its own API endpoint.
  app.post(NETSEND_PATH, async (req, reply) => {
    let body = req.body as any;
    // For file uploads, we need to process the body differently
    if (req.isMultipart()) {
      let currentBody = body as Record<
        string,
        {fieldname: string; value: string; filename?: string}
      >;
      body = {};
      let fileParams = {} as any;
      for (const part in currentBody) {
        let key = currentBody[part].fieldname;
        let value = currentBody[part].value;
        let filename = currentBody[part].filename;
        let fieldname = currentBody[part].fieldname;
        if (value === "undefined") continue;
        if (!value) continue;
        // If this part is a file, store it separately to combine
        // with the body later
        if (filename) {
          fileParams[fieldname] = value;
        } else {
          // Params are JSON strings, so we need to parse them
          if (key === "params") {
            body = {...body, ...JSON.parse(value)};
          } else {
            body[key] = value;
          }
        }
      }
      body = {...body, ...fileParams};
    }
    const clientId =
      req.headers.authorization?.replace("Bearer ", "").replace("bearer", "") ||
      "";
    checkBodyInput(body, clientId);
    const clientContext = new DataContext(clientId, database);
    const {input, ...params} = body;
    try {
      const inputFunction = inputs[input];
      const response =
        (await inputFunction(clientContext, params as any)) || {};

      // Send the result back to the client, regardless of what it is.
      return response;
    } catch (err) {
      let message = err;
      if (err instanceof Error) {
        message = err.message;
      }
      console.error(`Error in input ${String(input)}: ${message}`);
      if (err instanceof Error && process.env.NODE_ENV !== "production")
        console.error(err.stack);
      return reply
        .code(400)
        .header("content-type", "application/json")
        .send(JSON.stringify({error: message}));
    }
  });

  // This maps all card data to a single HTTP endpoint.
  // In the future, this could be split into separate
  // HTTP endpoints
  app.get(CARDREQUEST_PATH, async (req, reply) => {
    const clientId =
      req.headers.authorization?.replace("Bearer ", "").replace("bearer", "") ||
      "";
    try {
      checkBodyCardRequest(req.params, clientId);
      const cardSubs = cardSubscriptions[req.params.card] as any;
      const subscription = req.params.subscription;
      const clientContext = new DataContext(clientId, database);
      const data = await cardSubs[subscription].fetch(clientContext);
      return data;
    } catch (err) {
      if (err instanceof Error) {
        return reply
          .code(400)
          .header("content-type", "application/json")
          .send(JSON.stringify({message: err.message}));
      }
    }
  });

  app.post(NETREQUEST_PATH, async (req, reply) => {
    let body = req.body as any;
    const clientId =
      req.headers.authorization?.replace("Bearer ", "").replace("bearer", "") ||
      "";
    checkBodyNetRequest(body, clientId);
    const clientContext = new DataContext(clientId, database);
    const {request, ...params} = body;
    try {
      const requestFunction = requests[request];
      const response =
        (await requestFunction(clientContext, params as any, null)) || {};

      // Send the result back to the client, regardless of what it is.
      return response;
    } catch (err) {
      let message = err;
      if (err instanceof Error) {
        message = err.message;
      }
      console.error(`Error in request ${String(request)}: ${message}`);
      if (err instanceof Error && process.env.NODE_ENV !== "production")
        console.error(err.stack);
      return reply
        .code(400)
        .header("content-type", "application/json")
        .send(JSON.stringify({error: message}));
    }
  });
}
