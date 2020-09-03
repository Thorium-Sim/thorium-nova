import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class WarpEnginesComponent extends Component {
  static id: "warpEngines" = "warpEngines";
  static defaults: ComponentOmit<WarpEnginesComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
