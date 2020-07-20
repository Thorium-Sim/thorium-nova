export type ComponentOmit<T> = Omit<T, "name" | "defaults" | "getDefaults">;

export abstract class Component {
  static id: string;
  static defaults: any;
  static getDefaults?: Function;
}
