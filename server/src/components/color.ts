import {Component, ComponentOmit} from "./utils";

export class ColorComponent extends Component {
  static id: "color" = "color";
  static defaults: ComponentOmit<ColorComponent> = {
    color: "hsl(0,100%,50%)",
  };

  color!: string;
}
