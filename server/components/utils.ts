export type ComponentOmit<T> = Omit<T, "id" | "defaults" | "getDefaults">;

export abstract class Component {
  static id: string;
  static defaults: any;
  static getDefaults?: Function;
}
