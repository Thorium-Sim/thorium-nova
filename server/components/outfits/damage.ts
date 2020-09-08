import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component describes the damage that has been applied to this system, as well as necessary aspects of its repair.",
})
export class DamageComponent extends Component {
  static id: "damage" = "damage";
  static defaults: ComponentOmit<DamageComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
