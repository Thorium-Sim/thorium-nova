import {Component} from "./utils";

export class ThemeComponent extends Component {
  static id = "theme" as const;

  pluginId: string = "Thorium Default";
  themeId: string = "Default Theme";
}
