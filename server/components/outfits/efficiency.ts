import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component describes the efficiency of the ship system. Efficiency affects many things, like how much power is required; how much heat the system produces; the chance that it will randomly fail; and how well the system operates (engines thrusting at less than max speed)",
})
export class EfficiencyComponent extends Component {
  static id: "efficiency" = "efficiency";
  static defaults: ComponentOmit<EfficiencyComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
