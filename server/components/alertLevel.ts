import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

export type AlertLevelT = "1" | "2" | "3" | "4" | "5" | "p";
@ObjectType()
export class AlertLevelComponent extends Component {
  static id: "alertLevel" = "alertLevel";
  static defaults: ComponentOmit<AlertLevelComponent> = {
    alertLevel: "5",
    alertLevelLock: false,
  };

  @Field(type => String)
  alertLevel: AlertLevelT = "5";

  @Field({
    description: "Whether the alert condition can be changed by the crew.",
  })
  alertLevelLock: boolean = false;
}
