import {Field, ObjectType} from "type-graphql";

@ObjectType()
export class Coordinates {
  @Field()
  x: number = 0;
  @Field()
  y: number = 0;
  @Field()
  z: number = 0;
}
