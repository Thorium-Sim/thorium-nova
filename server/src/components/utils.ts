export type ComponentOmit<T> = Omit<
  T,
  "id" | "defaults" | "getDefaults" | "serialize"
>;

export abstract class Component {
  static id: string;
  static defaults: any;
  static getDefaults?: Function;
  static serialize(component: Component): any {
    return component;
  }
  constructor(params: any) {
    Object.assign(this, params);
  }
}
