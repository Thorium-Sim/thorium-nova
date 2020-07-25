import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class TagsComponent extends Component {
  static id: "tags" = "tags";
  static defaults: ComponentOmit<TagsComponent> = {
    tags: [],
  };

  @Field(type => [String])
  tags: string[] = [];
}
