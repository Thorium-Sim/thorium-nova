import {Field, InputType, ObjectType} from "type-graphql";

@ObjectType()
@InputType("CoordinatesInput")
export class Coordinates {
  @Field()
  x: number = 0;
  @Field()
  y: number = 0;
  @Field()
  z: number = 0;
}
