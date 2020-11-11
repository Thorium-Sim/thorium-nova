import Entity from "server/helpers/ecs/entity";
import {getAnyFaction} from "server/schema/faction";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class FactionAssignmentComponent extends Component {
  static id: "factionAssignment" = "factionAssignment";
  static getDefaults(): ComponentOmit<FactionAssignmentComponent> {
    return {
      factionId: "Neutral",
      faction: null,
    };
  }

  @Field()
  factionId: string = "Neutral";

  @Field(type => Entity, {nullable: true})
  get faction(): Entity | null {
    return getAnyFaction(this.factionId) || null;
  }
  set faction(fac) {}
}
