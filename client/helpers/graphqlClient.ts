import {SubscriptionClient} from "subscriptions-transport-ws";
import gql from "graphql-tag";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

const websocketUrl =
  process.env.NODE_ENV === "production"
    ? `${wsProtocol}//${window.location.host}/graphql`
    : `${wsProtocol}//${hostname}:${
        parseInt(window.location.port || "3000", 10) + 1
      }/graphql`;

const client = new SubscriptionClient(websocketUrl, {
  reconnect: true,
});
// @ts-ignore
window.client = client;
// @ts-ignore
window.gql = gql;
export default client;
