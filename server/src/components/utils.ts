import {nextTick} from "process";
export abstract class Component {
  static id: string;
  static serialize(component: Omit<Component, "init">): any {
    return component;
  }
  constructor(params: any = {}) {
    nextTick(() => {
      // We have to wait to initialize until the next tick,
      // because otherwise the sub-classed components defaults
      // will override the data passed in to the constructor.
      this.init(params);
    });
  }
  init(params: any = {}) {
    (Object.getOwnPropertyNames(this) as (keyof this)[]).forEach(key => {
      if (key !== "init") {
        this[key] = params[key] || this[key];
      }
    });
  }
}
