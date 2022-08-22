export class Component {
  static id: string = "Component";
  static serialize(component: Omit<Component, "init">): any {
    return component;
  }
  static create(params: any = {}) {
    if (this.id === "Component")
      throw new Error(
        "Component is an abstract class that you must extend to use."
      );
    const comp = new this();
    comp.init(params);
    return comp;
  }
  init(params: any = {}) {
    (Object.getOwnPropertyNames(this) as (keyof this)[]).forEach(key => {
      if (key !== "init") {
        this[key] = params[key] ?? this[key];
      }
    });
  }
}
