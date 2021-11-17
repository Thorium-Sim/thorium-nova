import {Entity} from "server/src/utils/ecs";
import type {DataContext} from "./DataContext";
export {DataContext};
export type UnionToIntersection<U> = (
  U extends U ? (x: U) => 0 : never
) extends (x: infer I) => 0
  ? Extract<I, U>
  : never;
/**
 * All of the different ways a client can be considered offline.
 */
export type OfflineStates =
  | "blackout"
  | "offline"
  | "power"
  | "lockdown"
  | "maintenance"
  | null;

type SecondParam<Func extends (...args: any) => any> = Func extends (
  first: any,
  second: infer R,
  ...args: any
) => any
  ? R
  : never;
type ThirdParam<Func extends (...args: any) => any> = Func extends (
  first: any,
  second: any,
  third: infer R,
  ...args: any
) => any
  ? R
  : never;
type AnyFunc = (...args: any) => any;
export type InputParams<Inputs extends Record<string, AnyFunc>> = {
  [Property in keyof Inputs]: SecondParam<Inputs[Property]>;
};
export type RequestPublishParams<Requests extends Record<string, AnyFunc>> = {
  [Property in keyof Requests]: ThirdParam<Requests[Property]>;
};
export type InputReturns<Inputs extends Record<string, AnyFunc>> = {
  [Property in keyof Inputs]: ReturnType<Inputs[Property]>;
};

// TODO: Aug 16 - Build out the notification system
type NotificationNames = "";

export type DataSelection = {
  /**
   * For high-frequency data updates for a card. This function is called for every entity
   * for every network frame. Returning true will include this entity in the
   * list sent of entities sent to the client.
   */
  dataStream?: (entity: Entity, context: DataContext) => boolean;
  /**
   * For low-frequency data subscriptions for a card. When the `publish` function is called
   * with a `subscriptionName`, it will trigger the corresponding subscription function.
   * This function will receive params (most likely the shipId) and should deterministically
   * send the appropriate data based on the current context.
   */
  subscriptions?: {
    [subscriptionName: string]: (params: any, context: DataContext) => any;
  };
  /**
   * Subscribing to any notifications or one-off actions which might be relevant to
   * a card. When the notification is triggered, Thorium will automatically determine
   * if it is relevant to the subscriber.
   */
  notifications?: NotificationNames[];
};
