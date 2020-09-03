import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class ImpulseEnginesComponent extends Component {
  static id: "impulseEngines" = "impulseEngines";
  static defaults: ComponentOmit<ImpulseEnginesComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
