import {Component, ComponentOmit} from "./utils";

export class IsPlayerShipComponent extends Component {
  static id: "isPlayerShip" = "isPlayerShip";
  static defaults: ComponentOmit<IsPlayerShipComponent> = {
    value: true,
  };

  value: true = true;
}
