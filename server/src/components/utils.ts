export abstract class Component {
  static id: string;
  static serialize(component: Omit<Component, "init">): any {
    return component;
  }
  init(params: any = {}) {
    Object.assign(this, params);
    return this;
  }
}
