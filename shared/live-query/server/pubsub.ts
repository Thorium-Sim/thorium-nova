import {EventEmitter} from "events";
import {createRecursiveProxy} from "../proxy";
import {BuildProcedure} from "./procedureBuilder";
import {AnyRouter} from "./router";
import {Procedure, ProcedureParams, UnsetMarker} from "./procedure";

type RouterRequests<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends
    | BuildProcedure<"request", any, any>
    | AnyRouter
    ? P
    : never]: TRouter[P] extends Procedure<"request", ProcedureParams>
    ? TRouter[P]["_def"]["_publish"] extends UnsetMarker
      ? (publishInput?: TRouter[P]["_def"]["_publish"]) => void
      : (publishInput: TRouter[P]["_def"]["_publish"]) => void
    : TRouter[P] extends AnyRouter
    ? RouterRequests<TRouter[P]>
    : never;
};

type RouterSub<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends
    | BuildProcedure<"request", any, any>
    | AnyRouter
    ? P
    : never]: TRouter[P] extends Procedure<"request", ProcedureParams>
    ? (publish: any) => () => void
    : TRouter[P] extends AnyRouter
    ? RouterSub<TRouter[P]>
    : never;
};

export class PubSub<TRouter extends AnyRouter> {
  protected ee: EventEmitter;
  private subscriptions: {[key: string]: [string, (...args: any[]) => void]};
  private subIdCounter: number;
  constructor() {
    const ee = new EventEmitter();
    ee.setMaxListeners(250);
    this.ee = ee;
    this.subscriptions = {};
    this.subIdCounter = 0;
  }
  public publish = createRecursiveProxy(({path, args: [payload]}) => {
    const trigger = path.join("/");
    this.ee.emit(trigger, payload);
  }) as RouterRequests<TRouter>;

  public subscribe = createRecursiveProxy(
    ({path, args: [onMessage, id]}: any) => {
      const trigger = path.join("/");
      const listener = (payload: any) => onMessage(payload);
      this.ee.addListener(trigger, listener);
      this.subIdCounter = this.subIdCounter + 1;
      const subId = this.subIdCounter;
      this.subscriptions[subId] = [trigger, listener];
      return () => this.unsubscribe(subId);
    },
  ) as RouterSub<TRouter>;

  private unsubscribe(subId: number) {
    if (this.subscriptions[subId]) {
      const [triggerName, onMessage] = this.subscriptions[subId];
      delete this.subscriptions[subId];
      this.ee.removeListener(triggerName, onMessage);
    }
  }
}
