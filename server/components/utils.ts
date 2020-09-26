export type ComponentOmit<T> = Omit<T, "id" | "defaults" | "getDefaults">;

export abstract class Component {
  static id: string;
  static defaults: any;
  static getDefaults?: Function;
  // [prop: string]:any
  // constructor(params:Record<string,any>) {
  //   Object.entries(params).forEach(([key,value]) => {
  //     this[key] = value;
  //   })
  // }
}
