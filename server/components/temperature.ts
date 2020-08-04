import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class TemperatureComponent extends Component {
  static id: "temperature" = "temperature";
  static defaults: ComponentOmit<TemperatureComponent> = {
    // Temperature in Kelvin
    temperature: 5800,
  };

  @Field()
  temperature: number = 5800;
}
