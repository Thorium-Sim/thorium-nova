import {Component} from "./utils";

export class IdentityComponent extends Component {
  static id = "identity" as const;

  /**
   * The name of the entity.
   */
  name: string = "Entity";

  /**
   * Should only be used for information provided by the Flight Director
   */
  description?: string = "";
}
