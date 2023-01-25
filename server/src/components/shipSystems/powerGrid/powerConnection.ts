import {Component} from "../../utils";

export class PowerConnectionComponent extends Component {
  static id = "powerConnection" as const;

  /**
   * Entities which provide power to this entity
   */
  inputEntities: number[] = [];
  /**
   * Entities which this entity provides power to
   */
  outputEntities: number[] = [];
}
