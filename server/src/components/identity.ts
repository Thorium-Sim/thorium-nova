import {Component, ComponentOmit} from "./utils";

export class IdentityComponent extends Component {
  static id: "identity" = "identity";
  static defaults: ComponentOmit<IdentityComponent> = {
    name: "Entity",
    description: "",
  };

  name!: string;

  /**
   * Should only be used for information provided by the Flight Director
   */
  description?: string;
}
