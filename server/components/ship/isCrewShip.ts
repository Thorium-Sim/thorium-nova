import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsCrewShip extends Component {
  static id: "isCrewShip" = "isCrewShip";
  static defaults: ComponentOmit<IsCrewShip> = {
    value: true,
  };

  @Field()
  value: true = true;
}
