import {StoreObject} from "@thorium/db-fs";
import {ServerDataModel} from "../classes/ServerDataModel";
import {DataContext} from "../utils/DataContext";
import type buildHTTPServer from "./httpServer";
import inputs, {AllInputNames} from "../inputs";
import {
  cardSubscriptions,
  AllSubscriptions,
  DataCardNames,
  SubscriptionNames,
} from "client/src/utils/cardData";
import {FlightDataModel} from "../classes/FlightDataModel";

const NETSEND_PATH = "/netSend";
const NETREQUEST_PATH = "/netRequest";

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
      `Invalid event input. "${bodyObject.input}" is not a valid input name.`
    );
  }
}
function checkBodyRequest(
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
    throw new Error(`Invalid card name: ${bodyObject.card}`);
  const cardSubs = cardSubscriptions[bodyObject.card];
  if (!(bodyObject.subscription in cardSubs))
    throw new Error(
      `Invalid subscription for card '${bodyObject.card}': ${bodyObject.subscription}`
    );
}
export function setUpAPI(
  app: ReturnType<typeof buildHTTPServer>,
  database: {
    server: ServerDataModel & StoreObject;
    flight: FlightDataModel | null;
  }
) {
  // This just maps all of the inputs to a single HTTP endpoint.
  // In the future, this could be changed to make it so each of
  // these is its own API endpoint.
  app.post(NETSEND_PATH, async (req, reply) => {
    const body = req.body;
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
      console.error(`Error in input ${input}: ${message}`);
      return reply
        .code(400)
        .header("content-type", "application/json")
        .send(JSON.stringify({error: message}));
    }
  });

  // This maps all card data to a single HTTP endpoint.
  // In the future, this could be split into separate
  // HTTP endpoints
  app.post(NETREQUEST_PATH, async (req, reply) => {
    const body = req.body;
    const clientId =
      req.headers.authorization?.replace("Bearer ", "").replace("bearer", "") ||
      "";
    try {
      checkBodyRequest(body, clientId);
      const cardSubs = cardSubscriptions[body.card] as any;
      const subscription = body.subscription;
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
}
