import {Component} from "./utils";

export class PopulationComponent extends Component {
  static id = "population" as const;
  count: number = 0;
}
