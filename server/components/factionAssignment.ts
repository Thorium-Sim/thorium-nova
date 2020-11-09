import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class FactionAssignmentComponent extends Component {
  static id: "factionAssignment" = "factionAssignment";
  static getDefaults(): ComponentOmit<FactionAssignmentComponent> {
    return {
      factionId: "Neutral",
    };
  }

  @Field()
  factionId: string = "Neutral";
}
