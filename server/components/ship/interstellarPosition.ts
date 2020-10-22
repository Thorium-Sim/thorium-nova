import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class InterstellarPositionComponent extends Component {
  static id: "interstellarPosition" = "interstellarPosition";
  static defaults: ComponentOmit<InterstellarPositionComponent> = {};

  systemId?: string | null = null;

  @Field(type => Entity, {
    nullable: true,
    description:
      "The current system which the ship is in. If this is null, the ship is in interstellar space.",
  })
  system?: Entity | null;
}
