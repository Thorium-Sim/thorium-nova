import {Field, ObjectType} from "type-graphql";
import {TimerComponent} from "./timer";

@ObjectType()
export default class Components {
  [name: string]: Record<string, any> | undefined;
  @Field()
  timer?: TimerComponent;
}
